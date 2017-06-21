/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
/**
 * Illustrates how to create a placemark with a dynamically created image.
 *
 * @version $Id: CustomPlacemark.js 3320 2015-07-15 20:53:05Z dcollins $
 */


requirejs(['../src/WorldWind',
        './WHSLayerManager'],
    function (ww,
              LayerManager) {
        "use strict";

        // Tell World Wind to log only warnings.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        // Create the World Window.
        var wwd = new WorldWind.WorldWindow("canvasOne");

        // Add standard imagery layers.
        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];
        
         for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Create a layer manager for controlling layer visibility.
        var layerManger = new LayerManager(wwd);

        // Now set up to handle highlighting.
        var highlightController = new WorldWind.HighlightController(wwd);

        // Create the custom image for the placemark.

        var canvas = document.createElement("canvas"),
            ctx2d = canvas.getContext("2d"),
            size = 64, c = size / 2  - 0.5, innerRadius = 5, outerRadius = 20;

        canvas.width = size;
        canvas.height = size;

        var gradient = ctx2d.createRadialGradient(c, c, innerRadius, c, c, outerRadius);
        gradient.addColorStop(0, 'rgb(204, 255, 255)');
        gradient.addColorStop(0.5, 'rgb(102, 153, 255)');
        gradient.addColorStop(1, 'rgb(102, 0, 255)');

        ctx2d.fillStyle = gradient;
        ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
        ctx2d.fill();

        // Set up the common placemark attributes.

        var countrycode,
            countryname,
            conticode,
            countrylayername,
            countrylayernamePL,
            countryLayer,
            placemark,
            highlightAttributes,
            placemarkAttributes = new WorldWind.PlacemarkAttributes(null);

            placemarkAttributes.imageScale = 0.3;
            placemarkAttributes.imageOffset = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0.5,
                WorldWind.OFFSET_FRACTION, 0.5);
            placemarkAttributes.imageColor = WorldWind.Color.WHITE;
            placemarkAttributes.labelAttributes.scale = 0;
        var highlightedItems = [];
        var n = 0;

        $.ajax({
                url: '//aworldbridgelabs.com:9083/searchCountry',
                dataType: 'json',
                async: false,
                success: function (countrylayers) {
                    for (var m = 0; m < countrylayers.length; m++) {

                        // Create customized placemark layers per country.

                        countrycode = countrylayers[m].CountryCode;
                        countryname = countrylayers[m].CountryName;
                        conticode = countrylayers[m].ContinentCode;
                        countrylayername = conticode + "." + countryname;
                        countryLayer = new WorldWind.RenderableLayer(countrylayername);
                        countryLayer.enabled = false;

                        // Add the country layer to the World Window's layer list.
                        wwd.addLayer(countryLayer);
                    }
                }
        });

        // Load local sites' json file by country to create multiple placemark per country.

        $.ajax({
            url: '//aworldbridgelabs.com:9083/searchSite',
            dataType: 'json',
            async: false,
            success: function (SitesPL) {
                //alert("a" + SitesPL.length);
                // Create the placemarks for one country.
                for (var i = 0; i < SitesPL.length; i++) {

                    placemark = new WorldWind.Placemark(new WorldWind.Position(SitesPL[i].LatiDecimal, SitesPL[i].LongDecimal, 1e2), false, null);
                    placemark.label = SitesPL[i].ContinentCode + "," + SitesPL[i].CountryCode + "," + SitesPL[i].SiteID;
                    placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;

                    // Create the placemark attributes for the placemark.
                    placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);

                    // Wrap the canvas created above in an ImageSource object to specify it as the placemark image source.
                    placemarkAttributes.imageSource = new WorldWind.ImageSource(canvas);
                    placemark.attributes = placemarkAttributes;

                    // Create the highlight attributes for this placemark. Note that the normal attributes are specified as
                    // the default highlight attributes so that all properties are identical except the image scale. You could
                    // instead vary the color, image, or other property to control the highlight representation.
                    highlightAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
                    highlightAttributes.imageScale = 0.5;
                    placemark.highlightAttributes = highlightAttributes;

                    // Create customized placemark layers per country.
                    countrylayernamePL = SitesPL[i].ContinentCode + "." + SitesPL[i].CountryName;

                    var AddPL = function (layerN, callback) {
                        var wlayers = wwd.layers;

                        for (var m = 0; m < wlayers.length; m++) {
                            if (wlayers[m].displayName === layerN) {

                                // Add the placemark to the country layer.
                                wlayers[m].addRenderable(placemark);
                                n = 1;
                                break
                            }
                        }

                        if (typeof callback === "function") {

                            callback(layerN);

                        }
                    };

                    var placemarkNew = function (LayerN) {
                        if (n === 0) {
                            countryLayer = new WorldWind.RenderableLayer(LayerN);
                            countryLayer.enabled = false;
                            countryLayer.addRenderable(placemark);

                            // Add the country layer to the World Window's layer list.
                            wwd.addLayer(countryLayer);
                        } else {
                            n = 0;
                        }
                    };

                    AddPL(countrylayernamePL, placemarkNew);

                }
            }
        });

        // Now setup a pick handler.

        var sitePopUp = function(sitelabel) {
            // Locate JSON file
            var tokens = sitelabel.split(",");
            //var continentCode = tokens[0];
            //var countryCode = tokens[1];
            var siteid = tokens[2];
            var popupjsonpath = '//aworldbridgelabs.com:9083/popup';
            var sitename, picpath, sitedesc, siteurl;

            $.getJSON(popupjsonpath,function (res) {
                //Get site information.
                for (var n = 0; n < res.length; n++) {
                    if (res[n].SiteID === siteid) {
                        sitename = res[n].SiteName;
                        picpath = res[n].PicPath;
                        sitedesc = res[n].SiteDescription;
                        siteurl = res[n].SiteURL;
                        break;
                    }
                }

                //Insert site information into indexTest.html.
                var popupBodyItem = $("#popupBody");
                popupBodyItem.children().remove();

                var popupBodyName = $('<p class="site-name"><h4>' + sitename + '</h4></p>');
                var popupBodyDesc = $('<p class="site-description">' + sitedesc + '</p><br>');
                var popupBodyImg = $('<img class="site-img" src="' + picpath + '" /><br>');
                var popupBodyURL = $('<p class="site-URL">Please click <a href="' + siteurl + '" target="_blank"><span id="href"><b>here</b></span></a> for more detailed information</p>');

                popupBodyItem.append(popupBodyName);
                popupBodyItem.append(popupBodyDesc);
                popupBodyItem.append(popupBodyImg);
                popupBodyItem.append(popupBodyURL);

            });
        };


        var handleMouseCLK = function (o) {

            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var x = o.clientX,
                y = o.clientY;

            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
            for (var q = 0; q<pickList.objects.length; q++) {
                var pickedPL = pickList.objects[q].userObject;
                if (pickedPL instanceof WorldWind.Placemark) {

                    sitePopUp(pickedPL.label);

                    $(document).ready(function () {
                        // Make a popup Box after insert popup list items.

                        var modal = document.getElementById('popupBox');// Get the modal
                        var span = document.getElementById('closeIt');// Get the <span> element that closes the modal

                        // When the user double clicks the placemark, open the modal
                        modal.style.display = "block";

                        // When the user clicks on <span> (x), close the modal
                        span.onclick = function () {
                            modal.style.display = "none";
                        };

                        // When the user clicks anywhere outside of the modal, close it
                        window.onclick = function (event) {
                            if (event.target == modal) {
                                modal.style.display = "none";
                            }
                        }

                    })
                }
            }

            pickList = [];
        };

        var handleMouseMove = function (o) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var x = o.clientX,
                y = o.clientY;

            var redrawRequired = highlightedItems.length > 0; // must redraw if we de-highlight previously picked items

            // De-highlight any previously highlighted placemarks.
            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }
            highlightedItems = [];

            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));

            // Highlight the items picked by simply setting their highlight flag to true.
            if (pickList.objects.length > 0) {
                for (var p = 0; p < pickList.objects.length; p++) {
                    pickList.objects[p].userObject.highlighted = true;

                    // Keep track of highlighted items in order to de-highlight them later.
                    highlightedItems.push(pickList.objects[p].userObject);

                    // Detect whether the placemark's label was picked. If so, the "labelPicked" property is true.
                    // If instead the user picked the placemark's image, the "labelPicked" property is false.
                    // Applications might use this information to determine whether the user wants to edit the label
                    // or is merely picking the placemark as a whole.
                    if (pickList.objects[p].labelPicked) {
                        console.log("Label picked");
                    }
                }
            }

            // Update the window if we changed anything.
            if (pickList.objects.length > 0) {
                redrawRequired = true;
            }

            if (redrawRequired) {
                wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
            }
        };

        // Listen for mouse double clicks placemarks and then pop up a new dialog box.
        wwd.addEventListener("click", handleMouseCLK);

        // Listen for taps on mobile devices and then pop up a new dialog box.
        var tapRecognizer = new WorldWind.TapRecognizer(wwd, handleMouseCLK);

        // Listen for mouse moves and highlight the placemarks that the cursor rolls over.
        wwd.addEventListener("mousemove", handleMouseMove);

        // Listen for taps on mobile devices and highlight the placemarks that the user taps.
        var tapRecognizer = new WorldWind.TapRecognizer(wwd, handleMouseMove);

    });