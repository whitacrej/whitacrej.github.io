// JavaScript Document

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/layers/SceneLayer",

    "esri/Camera",
    "esri/widgets/Home",
    "esri/widgets/Compass",

    "esri/core/watchUtils",

    "dojo/domReady!"
], function (
    Map, MapView, SceneView, SceneLayer,
    Camera, Home, Compass,
    watchUtils
    ) {

    // Add Map
    var map = new Map({
        basemap: 'satellite',
        ground: 'world-elevation'
    });

    // Add 2D MapView
    var mapView = new MapView({
        id: 'mapView',
        container: 'mapViewDiv',
        map: map,
        center: [-88.227247, 40.102904],
        zoom: 2,
        // Disable zoom snapping to get the best synchonization
        constraints: {
            snapToZoom: false
        }
    });

    // Add home widget to the top right corner of the MapView
    var mapHome = new Home({
        view: mapView
    });
    mapView.ui.add(mapHome, "top-right");

    // Add compass widget to the top right corner of the view
    var compass = new Compass({
        view: mapView
    });
    mapView.ui.add(compass, "top-right");

    // Add 3D SceneView
    var sceneView = new SceneView({
        id: 'sceneView',
        container: 'sceneViewDiv',
        map: map,
        center: [-88.227247, 40.102904],
        zoom: 2
    });

    // Remove navigation toggle widget from the SceneView
    sceneView.ui.remove("navigation-toggle");

    // Add home widget to the top right corner of the SceneView
    var sceneHome = new Home({
        view: sceneView
    });
    sceneView.ui.add(sceneHome, "top-right");

    // Move compass widget to top right corner of the SceneView
    sceneView.ui.move("compass", "top-right");

    // Create SceneLayer and add to the SceneView
    var sceneLayer = new SceneLayer({
        url: "https://gis.library.illinois.edu/arcgis/rest/services/Hosted/Buildings_3D/SceneServer/layers/0",
        popupEnabled: false
    });
    map.add(sceneLayer);


    /**
     * utility method that synchronizes the viewpoint of a view to other views
     */
    var synchronizeView = function (view, others) {
        others = Array.isArray(others) ? others : [others];

        var viewpointWatchHandle;
        var viewStationaryHandle;
        var otherInteractHandlers;
        var scheduleId;

        var clear = function () {
            if (otherInteractHandlers) {
                otherInteractHandlers.forEach(function (handle) {
                    handle.remove();
                });
            }
            viewpointWatchHandle && viewpointWatchHandle.remove();
            viewStationaryHandle && viewStationaryHandle.remove();
            scheduleId && clearTimeout(scheduleId);
            otherInteractHandlers = viewpointWatchHandle =
              viewStationaryHandle = scheduleId = null;
        };

        var interactWatcher = view.watch('interacting,animation',
          function (newValue) {
              if (!newValue) {
                  return;
              }
              if (viewpointWatchHandle || scheduleId) {
                  return;
              }

              // start updating the other views at the next frame
              scheduleId = setTimeout(function () {
                  scheduleId = null;
                  viewpointWatchHandle = view.watch('viewpoint',
                    function (newValue) {
                        others.forEach(function (otherView) {
                            otherView.viewpoint = newValue;
                        });
                    });
              }, 0);

              // stop as soon as another view starts interacting, like if the user starts panning
              otherInteractHandlers = others.map(function (otherView) {
                  return watchUtils.watch(otherView,
                    'interacting,animation',
                    function (value) {
                        if (value) {
                            clear();
                        }
                    });
              });

              // or stop when the view is stationary again
              viewStationaryHandle = watchUtils.whenTrue(view,
                'stationary', clear);
          });

        return {
            remove: function () {
                this.remove = function () { };
                clear();
                interactWatcher.remove();
            }
        };
    };

    /**
     * utility method that synchronizes the viewpoints of multiple views
     */
    var synchronizeViews = function (views) {
        var handles = views.map(function (view, idx, views) {
            var others = views.concat();
            others.splice(idx, 1);
            return synchronizeView(view, others);
        });

        return {
            remove: function () {
                this.remove = function () { };
                handles.forEach(function (h) {
                    h.remove();
                });
                handles = null;
            }
        };
    };

    // bind the views
    synchronizeViews([sceneView, mapView]);


    // Animate the view after the views have loaded
    sceneView.then(function () {
        // All the resources in the SceneView and the map have loaded. Now execute additional processes

        var cam = new Camera({
            position: [-88.227247, 40.102904, 350],
            tilt: 75      // bird's eye view
        });

        sceneView.goTo(cam);

        // Define a viewopint object
        sceneHome.viewpoint = cam;

    }, function (error) {
        // Use the errback function to handle when the view doesn't load properly
        console.log("The view's resources failed to load: ", error);
    });

  //  mapView.load
  //      .then(function () {
  //          // All the resources in the MapView and the map have loaded. Now execute additional processes
  //          // the webmap successfully loaded
  //          // Define a viewopint object
  //          var vpt = mapView.viewpoint.clone();
  //          console.log("center: ");
  //          console.log(vpt.targetGeometry.latitude);
  //          mapHome.viewpoint = vpt;
  //      })
  //.otherwise(function (error) {
  //    // the webmap or portal failed to load
  //    console.log("The resource failed to load: ", error);
  //});

});
