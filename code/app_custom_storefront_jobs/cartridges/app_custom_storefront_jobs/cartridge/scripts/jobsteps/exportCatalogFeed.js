'use strict';

var catalog = require( 'dw/catalog' );
var ProductSearchModel = require("dw/catalog/ProductSearchModel");
var CatalogMgr = require("dw/catalog/CatalogMgr");
var Logger = require("dw/system/Logger");
var File = require("dw/io/File");
var FileWriter = require("dw/io/FileWriter");
var XMLStreamWriter = require("dw/io/XMLStreamWriter");
var XMLIndentingStreamWriter =require("dw/io/XMLIndentingStreamWriter");
var ProductMgr = require("dw/catalog/ProductMgr");
var URLUtils = require("dw/web/URLUtils");
var folderPath, folder, exportFile, fileWriter, xsw, skippedProducts, exportedProducts, today, date;
var searchModel, searchHits;
var validProduct = true;

exports.beforeStep = function( parameters, stepExecution ) {
    var selectedCategory= CatalogMgr.getCategory(parameters.selectedCategory);

    if( selectedCategory === "" || selectedCategory === null || selectedCategory === undefined ) {
        Logger.info("CATEGORIA NO SELECCIONADA")
        Logger.info("SelectedCategoryFrom BM "+ parameters.selectedCategory);
        searchHits= catalog.ProductMgr.queryAllSiteProducts();
    } else {
        Logger.info("CATEGORIA SELECCIONADA DEL BM "+ parameters.selectedCategory);
        searchModel = new ProductSearchModel();
        searchModel.setCategoryID(selectedCategory.ID);
        searchModel.setRecursiveCategorySearch(true);
        searchModel.search();
        searchHits = searchModel.getProductSearchHits();
    }

    folderPath = [File.LIBRARIES, 'PatPrimo', 'default'].join(File.SEPARATOR);
    folder = new File(folderPath);

    if (!folder.exists()) {
        folder.mkdirs();
    }

    today = new Date();
    date = today.getDate().toString() + today.getMonth().toString() + today.getYear().toString();
    exportFile = new File(folderPath + File.SEPARATOR + parameters.fileName +".xml");
    fileWriter = new FileWriter(exportFile, "UTF-8");
    xsw = new XMLStreamWriter(fileWriter);
    xsw = new XMLIndentingStreamWriter(fileWriter);
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeStartElement("rss");
    xsw.writeAttribute("version", "2.0");
    xsw.writeStartElement("channel");
    
    Logger.info("beforeStep - ExportFile: " + exportFile);
}

exports.read = function( parameters, stepExecution ) {
    if( searchHits.hasNext() ) {
        return searchHits.next();
    }
}

exports.process = function( searchHit, parameters, stepExecution ) {
    var product, log, tempCategory;
    var category = null;
    var categories = "";
    var catRead = ""; 
    var brand = ""; 
    var gtin = "";
    var color = "";
    product = searchHit;

    var categorySource = searchHit.isVariant() ? searchHit.masterProduct : searchHit;

    if (categorySource.primaryCategory && !categorySource.primaryCategory.root && categorySource.primaryCategory.isOnline()) {
        category = categorySource.primaryCategory;
    } else {
        for (var c = 0; c < categorySource.categories.length; c++) {
            var categoryCandidate = categorySource.categories[c];
            if (!categoryCandidate.root) {
                category = categoryCandidate;
                break;
            }
        }
    }

    tempCategory = category;
    while (categories !== null && tempCategory && !tempCategory.root) {
        categories = (categories.length > 0) ? tempCategory.displayName + " > " + categories : tempCategory.displayName;
        tempCategory = tempCategory.parent;
    }

    if (category == null) {
        log = log + "Category null";
        validProduct = false;
    } else {
        catRead = category.displayName;
    }
    
    // Get Product prices
    var productPriceModel = product.getPriceModel();
    var globalListPrice = productPriceModel.getPrice();

    // Get Product images
    var link = encodeURI(URLUtils.https("Product-Show", "pid", product.ID).toString())
    var imageLink ="";
    var images = product.getImages('hi-res');
    if (images.length > 0 && images[0].httpURL == null) {
        imageLink = encodeURI(images[0].httpURL.toString());
    }
    
    // Get Product brand
    if(product.brand === undefined || product.brand === null ){
        validProduct = false;
        log = log + "Producto sin marca";
    } else {
        brand = product.brand;
    }

    var availability = product.getAvailabilityModel().getAvailabilityStatus();
    var description = product.shortDescription ? product.shortDescription.toString() : product.getName();
    description = description.replace(/&/, "and");
    
    if(product.custom.color === undefined || product.custom.color === null ) {
        log = log + "Producto sin color";
    } else {
        color = product.custom.color;
    }
    
    if (product.UPC && product.UPC !== ""  ) {
        gtin=product.UPC;
    } else if (product.EAN && product.EAN !== "" ) {
        gtin=product.EAN;
    }

    var productObj = {
        id: product.ID,
        title: product.getName() || product.ID,
        sku: product.manufacturerSKU,
        description: description,
        category_type:catRead ,
        product_type:categories,
        brand: brand,
        color: color,
        mpn: "TBD", // Pendiente
        gtin: gtin,
        link: link,
        image_link: imageLink,
        price: globalListPrice,
        sale_price: globalListPrice, // Pendiente
        condition: "new",
        availability: availability,
        log: log,
        valid: validProduct
    }

    return productObj;
}

exports.write = function( lines, parameters, stepExecution ) {
    
    for (var i = 0; i < lines.size(); i++ ) {
        
        if (lines.get(i).valid) {
            Logger.info("Write function: Product " + lines.get(i).id);
            xsw.writeStartElement("item");
            xsw.getIndent();

            // Mandatory fields
            xsw.writeStartElement("id");
            xsw.writeCharacters(lines.get(i).id);
            xsw.writeEndElement();

            xsw.writeStartElement("title");
            xsw.writeCharacters(lines.get(i).title);
            xsw.writeEndElement();

            xsw.writeStartElement("sku");
            xsw.writeCharacters(lines.get(i).sku);
            xsw.writeEndElement();

            xsw.writeStartElement("description");
            xsw.writeCharacters(lines.get(i).description);
            xsw.writeEndElement();

            xsw.writeStartElement("gtin");
            xsw.writeCharacters(lines.get(i).gtin);
            xsw.writeEndElement();

            xsw.writeStartElement("mpn");
            xsw.writeCharacters(lines.get(i).mpn);
            xsw.writeEndElement();
                
            xsw.writeStartElement("brand");
            xsw.writeCharacters(lines.get(i).brand);
            xsw.writeEndElement();

            xsw.writeStartElement("color");
            xsw.writeCharacters(lines.get(i).color);
            xsw.writeEndElement();
            
            xsw.writeStartElement("category_type");
            xsw.writeCharacters(lines.get(i).category_type);
            xsw.writeEndElement();

            xsw.writeStartElement("product_type");
            xsw.writeCharacters(lines.get(i).product_type);
            xsw.writeEndElement();

            xsw.writeStartElement("image_link");
            xsw.writeCharacters(lines.get(i).image_link);
            xsw.writeEndElement();
            
            xsw.writeStartElement("price");
            xsw.writeCharacters(lines.get(i).price);
            xsw.writeEndElement();
            
            xsw.writeStartElement("link");
            xsw.writeCharacters(lines.get(i).link);
            xsw.writeEndElement();
            
            xsw.writeStartElement("condition");
            xsw.writeCharacters(lines.get(i).condition);
            xsw.writeEndElement();
            
            xsw.writeStartElement("availability");
            xsw.writeCharacters(lines.get(i).availability);
            xsw.writeEndElement();

            xsw.writeEndElement();
        } else {
            Logger.info("Producto sin atributos obligatorios: " + lines.get(i).id);
        }
    }
} 

exports.afterStep = function( success, parameters, stepExecution ) {
    if( success ) {
        xsw.writeEndElement();
        xsw.writeEndDocument();
    }
    xsw.close();
    fileWriter.close();
}
