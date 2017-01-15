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

    // Defined a Camera object
    var cam = new Camera({
        position: [-88.227247, 40.102904, 350],
        tilt: 75      // bird's eye view
    });

    sceneHome.viewpoint = cam;
    //mapHome.viewopint = cam;


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
});



// jQuery UI

$(function () {
    $("#switchButton").on("click", function () {
        $("#switchButton").hide("fade", 125);
        $(".mainDiv").switchClass("mainDiv", "mainDivTrans1", 125, "linear", function () {
            $(".mainDivTrans1").switchClass("mainDivTrans1", "mainDivTrans2", 125, "linear", function () {
                $(".mainDivTrans2").switchClass("mainDivTrans2", "ovDiv", 750, "linear");
            });
        });
        $(".ovDiv").switchClass("ovDiv", "ovDivTrans1", 750, "linear", function () {
            $(".ovDivTrans1").switchClass("ovDivTrans1", "ovDivTrans2", 125, "linear", function () {
                $(".ovDivTrans2").switchClass("ovDivTrans2", "mainDiv", 125, "linear", $("#switchButton").show("fade", 500));
            });
        });

    });
});