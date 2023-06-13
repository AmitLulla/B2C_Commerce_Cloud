Product Image Wrapper (ProductImageSO) for Dynamic Imaging Service
==================================================================

Introduction
------------

Product Image Wrapper (ProductImageSO) is a best practice for implementing Demandware Dynamic Imaging Service.

The DW Dynamic Imaging Service is a great help when you need multiple product image sizes and don't have the backend systems or processes implemented which are required to scale and replicate all the data to DW sandboxes or you don't want to waste disk space for additional product image resolutions. All you need is one high resolution image per product.

What's a bit of a problem is that when generating a DIS Image URL, you need to use a specific API and provide transformation parameters in the form of an object. Sometimes this requirement leads to scattered transformation information and that in turn can lead to storefront design inconsistencies; something you definitely want to avoid.
Thus, it is a good idea to centralize this type of transformation configuration, so it can easily be changed across the entire site. Nothing would be more appropriate than deploying a configuration file alongside the cartridge code. In our case we use cartrige/preferences/image_config_DIS.json.

The second, very appreciated property of a generic implementation is that introducing it is almost straight forward so it can be done without disturbing the existing functionality and with the current set of product view types. For instance; let's take SFRA as an example, where we have the view types "large", "medium", "small" and "swatch". At the same time new view types should be easy to add - e.g. being able to add an 'icon' view type almost just by using a different configuration.
The ProductImage embedded in the ProductImageDIS.js makes use of the configuration setup and can be used for easy replacement of image rendering code that is currently being used in your application.

Documentation
-------------
Detailed information and usage details for the Product Image Wrapper are provided in the [Wiki](https://github.com/SalesforceCommerceCloud/dis-product-image-wrapper/wiki)


Support / Contributing
----------------------
Feel free to create isseus and enhancement requests or discuss on the existing ones, this will help us understanding in which area the biggest need is. For discussions please start a topic on the [Community Suite discussion board](https://xchange.demandware.com/community/developer/community-suite/content).

Release History
---------------
- 2018/10/02 - [1.0.0](https://github.com/SalesforceCommerceCloud/dis-product-image-wrapper/releases/tag/1.0.0) - Initial SFRA release

License
-------
Licensed under the current NDA and licensing agreement in place with your organization. (This is explicitly not open source licensing.)
