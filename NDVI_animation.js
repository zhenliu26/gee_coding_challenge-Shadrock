// Get the MODIS NDVI collection
var col = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI');

// Define a mask to clip the NDVI data by.
var mask = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_co', 'CH'))
mask = ee.Feature(mask.union().first())
// get the region of study area by the feature bounds of mask
var region = ee.Geometry.Polygon(
  [[[73.49973412904068, 18.16038895861446],
    [73.49973412904068, 53.560710974697315],
    [134.7751958952184, 53.560710974697315],
    [134.7751958952184, 18.16038895861446]]],
  null, false
);
// calculate the data of image for each image
col = col.map(function(img) {
  var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
  return img.set('doy', doy);
});
// get the interval for each 16 days
var distinctDOY = col.filterDate('2013-01-01', '2014-01-01');


// 1. Creating a filter that will identify matching images between the distinct and complete collections by the doy property
// 2. Defining a saveAll join that will produce a list of all matches per distinct 'doy' in a property called 'doy_matches'
// 3. Applying the join
// Define a filter that identifies which images from the complete collection
// match the DOY from the distinct DOY collection.
var filter = ee.Filter.equals({leftField: 'doy', rightField: 'doy'});

// Define a join.
var join = ee.Join.saveAll('doy_matches');

// Apply the join and convert the resulting FeatureCollection to an
// ImageCollection.
var joinCol = ee.ImageCollection(join.apply(distinctDOY, col, filter));

// Apply median reduction among matching DOY collections.
var comp = joinCol.map(function(img) {
  var doyCol = ee.ImageCollection.fromImages(
    img.get('doy_matches')
  );
  return doyCol.reduce(ee.Reducer.median());
});

var visParams = {
  min: 0.0,
  max: 9000.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

// Create RGB visualization images for use as animation frames.
var rgbVis = comp.map(function(img) {
  return img.visualize(visParams).clip(mask);
});
// set the parameters for the gif
var gifParams = {
  'region': region,
  'dimensions': 600,
  'crs': 'EPSG:3857',
  'framesPerSecond': 10
};

// Print the GIF URL to the console.
print(rgbVis.getVideoThumbURL(gifParams));