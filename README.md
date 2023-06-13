# Patprimo
Repositorio SALESFORCE Patprimo - Job + Steptypes

#steptypes.json

- "@type-id":"custom.exportCatalogFeed" 
> Name to see in the BM Jobs
- "description":"Custom Job for exporting product attributes and import them into 3rd party vendors"
> Description that we can see in job configurations BM

- "module":"app_custom_storefront_jobs/cartridge/scripts/jobsteps/feed.js"
> Path of the file being executed

- Function order Execution 

"before-step-function":"beforeStep"
"read-function":"read"
"process-function":"process"
"write-function":"write"
"after-step-function":"afterStep"

- "chunk-size":1000 > Size of the data collect (It iterates)

-"parameters":  > Parameters declared in the BM Jobs configurations




#feed.js

 -parameters.selectedCategory
 
 + Returns Parameters in the BM From Job , Declared in steptypes.json as selectedCategory (Not Required)
 
 #Ensure that the category selected it is the real existing ID from BM

 -searchModel.setCategoryID(selectedCategory.ID);
 
 + Category assignment for specific search
 
 -searchModel.search();
 
 + Search for all the available products in that category
 
 -searchHits = searchModel.getProductSearchHits();
 
 + Returns all the products assigned in a collection that we can iterate to the end
 
 // The job Works in Two Conditions
 
 1- Category Selected: Search the selected catalog and find the category by id to export a file in XML
 
 2- Category not Selected : Search all catalog and export the products to a file in XML
