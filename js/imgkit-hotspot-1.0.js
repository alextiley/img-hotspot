/**
 * imgkit: Hotspot Generator
 * 
 * @version			1.0
 * @author			Alex Tiley
 * @email			alextiley@gmail.com
 * @documentation	Coming soon...
 *
 */

var imgkit = imgkit || {};

imgkit.hotspot = (function () {

	var $imageContainer = $(),
		$attrContainer = $(),
		$imageElement = $(),
		$hotspots = $(),
		spotCount = 0,
		config = {
			icon: './img/hotspot-tiny.png'
		};

	// Retrieve new images from the file input and display on-screen
	var getImage = function (input, initPlottingCallback) {
		
		var reader = new FileReader(),
			imgDimensions = {},
			image;

		// Removes the old image from the page
		var resetVisibleImage = function () {
			$imageContainer.remove();
		};

		// Inserts the new image to the DOM
		var displayImage = function (image, input) {

			$imageContainer = $('<div id="hotspot_image"><img src="' + image + '" class="hotspot_target" /></div>');
			$imageElement = $imageContainer.find('img.hotspot_target');

			$(input).after($imageContainer.css({
				'visibility': 'hidden',
				'position': 'relative'
			}));

			$imageElement.on('load', function () {

				imgDimensions = getImgDimensionsByElement($imageElement);

				if (imgDimensions.x > 80 && imgDimensions.y > 80) {

					$imageElement.css({
						'height': imgDimensions.y,
						'width': imgDimensions.x,
						'cursor': 'crosshair'
					});

					$imageContainer.css({
						'visibility': 'visible'
					});

					initPlottingCallback.call(input);

				} else {
					throw new Error('The hotspot image is too small. Images should be no smaller than 80 x 80 pixels.');
				}
			});
				
			$imageElement.on('error', function () {
				throw new ReferenceError('There was a problem loading the specified image. Perhaps it\'s corrupt?');
			});
				
		};

		if (typeof FileReader !== 'undefined') {
			
			resetVisibleImage();

			reader.onload = function (e) {
				return displayImage.call(e, e.target.result, input);
			}
			reader.readAsDataURL(input.files[0]);

		}
	};

	// Gets the height and width of an image in the DOM
	var getImgDimensionsByElement = function ($image) {
		return {
			x: $image.width(),
			y: $image.height()
		};
	}

	// Inserts a hidden image to the DOM to allow access to height and width
	var getImgDimensionsByUrl = function (imageUrl, $appendToElement, dimensionsKnownCallback) {
	
		var $thisImage = $('<img src="' + imageUrl + '" />').css({'visibility': 'hidden'}).appendTo($appendToElement),
			dimensions;

		// Once the image is loaded, get the dimensions and pass to the callback
		$thisImage.load(function () {
			
			dimensions = getImgDimensionsByElement($(this));

			$(this).remove();

			dimensionsKnownCallback.call(dimensions);
		});

		$thisImage.error(function () {
			$(this).remove();
			throw new ReferenceError('The image \'' + imageUrl + '\' could not be found. Please provide a valid image path.');
		});

	};

	var resetVisibleSpotAttributes = function () {
		$attrContainer.remove();
	}

	var styleSelectedSpot = function (spotElement) {

		$hotspots.not($(spotElement)).css({
			'outline': 'none',
			'background-color': 'transparent'
		});

		$(spotElement).css({
			'outline': '3px dotted #000',
			'background-color': '#fff'
		});
	}

	var getSpotAttributes = function (spotElement) {

		var $spotAttrs = $('<div id="hotspot_attributes"></div>'),
			attrs = spotElement.attributes,
			blacklistedAttrs = ['style'],
			attr,
			i;

		for (i = 0; i < attrs.length; i++) {
			attr = attrs[i];
			if (attr.specified && $.inArray(attr.name, blacklistedAttrs) === -1) {
				$spotAttrs.append('<input type="text" class="attribute ' + attr.name + '" value="' + attr.name + '" />');
				$spotAttrs.append('<input type="text" class="value ' + attr.name + '" value="' + attr.value + '" />');
			}
		}

		return $spotAttrs;
	}

	var getNewFieldTemplate = function () {
		return $('<div>test</div>');
	}

	var initSpotConfig = function (e) {

		// Save any changes to the last spot's configuration
		//saveLastSelectedSpot();

		// Remove last spot's attribute configurator
		resetVisibleSpotAttributes();
		
		// Style selected spot to show it's selected
		styleSelectedSpot(this);

		// Get all fields associated with this spot
		$attrContainer = getSpotAttributes(this);
		
		// Get the new field template and prepend to attributes
		$attrContainer.prepend(getNewFieldTemplate());

		// Show all fields beneath the image
		$imageContainer.after($attrContainer);

		// Set up the save fields event
		// initSaveSpotData();

		return false;
	}

	var plotHotspot = function (e) {

		spotCount++;
		
		var $hotspot = $('<a id="hotspot_' + spotCount + '"></a>').css({
			'position': 'absolute',
			'display': 'block',
			'left': (e.pageX - $(this).offset().left) - (e.data.x / 2),
			'top': (e.pageY - $(this).offset().top) - (e.data.y / 2),
			'height': e.data.y,
			'width': e.data.x,
			'background': 'url(' + config.icon + ')',
			'cursor': 'pointer'
		});

		$imageContainer.append($hotspot);

		$hotspots = $hotspots.add($hotspot);

		$hotspot.on('click', initSpotConfig).click();
	}

	var initPlotting = function () {

		getImgDimensionsByUrl(config.icon, $imageContainer, function () {
			if (this.x < 64 && this.y < 64) {
				$imageElement.on('click', null, this, plotHotspot);
			} else {
				throw new Error('The hotspot icon is too large. Icons should be no larger than 64 x 64 pixels.');
			}
		});

	}

	var getSpotMarkup = function () {

		var $hotspotItems = $hotspots.clone(),
			$thisHotspot = $(),
			markup = $('<div><div class="hotspot_container">\n\n</div></div>'),

			i;

		for (i = 0; i < $hotspotItems.length; i++) {
			$thisHotspot = $($hotspotItems[i]);
			markup.find('div').append($thisHotspot);
		}

		console.log(markup.html());

		return false;
	}

	var initMarkupGeneration = function (input) {
		
		var $createMarkupButton = $('<button type="button">Generate Markup</button>');

		$(input).after($createMarkupButton);

		$createMarkupButton.on('click', getSpotMarkup);

	}

	// Public API
	return {
		initEditor: function ($el, opts) {
			
			config = $.extend({}, config, opts);

			// When the image is uploaded, show the image on screen and initialise hotspot mapping
			$el.on('change', '[name=uploaded_image]', function () {
				getImage(this, function () {
					initPlotting();
					initMarkupGeneration(this);
				});
			});
		}
	};

}());

// TODO: output form from the js rather than invoking on a form
$(function () {
	imgkit.hotspot.initEditor($('#hot_spot'));
});