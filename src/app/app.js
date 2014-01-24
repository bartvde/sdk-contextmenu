/**
 * Add all your dependencies here.
 *
 * @require widgets/Viewer.js
 * @require plugins/LayerTree.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 * @require plugins/WMSCSource.js
 * @require plugins/ZoomToExtent.js
 * @require plugins/NavigationHistory.js
 * @require plugins/Zoom.js
 * @require plugins/AddLayers.js
 * @require plugins/RemoveLayer.js
 * @require plugins/WMSGetFeatureInfo.js
 * @require RowExpander.js
 */

// see http://osgeo-org.1560.x6.nabble.com/Overwrite-and-extend-initialize-function-of-a-class-td4473446.html
function overwrite(C, o) {
    if (typeof o.initialize === "function" &&
        C === C.prototype.initialize) {
        // OL 2.11
        var proto = C.prototype;
        var staticProps = OpenLayers.Util.extend({}, C);

        C = o.initialize;

        C.prototype = proto;
        OpenLayers.Util.extend(C, staticProps);
    }
    OpenLayers.Util.extend(C.prototype, o);
    return C;
};

OpenLayers.Control.WMSGetFeatureInfo = overwrite(OpenLayers.Control.WMSGetFeatureInfo, {
    setMap: function(map) {
        this.map = map;
        if (this.handler) {
            this.handler.setMap(map);
        }
        if (this.handleRightClicks) {
            this.map.viewPortDiv.oncontextmenu = OpenLayers.Function.False;
        }
    },
    initialize: function(options) {
        this.handleRightClicks = true;
        options = options || {};
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        if(!this.format) {
            this.format = new OpenLayers.Format.WMSGetFeatureInfo(
                options.formatOptions
            );
        }

        if(this.drillDown === true) {
            this.hover = false;
        }

        if(this.hover) {
            this.handler = new OpenLayers.Handler.Hover(
                   this, {
                       'move': this.cancelHover,
                       'pause': this.getInfoForHover
                   },
                   OpenLayers.Util.extend(this.handlerOptions.hover || {}, {
                       'delay': 250
                   }));
        } else {
            var callbacks = {};
            callbacks['rightclick'] = this.showContextMenu;
            callbacks[this.clickCallback] = this.getInfoForClick;
            this.handler = new OpenLayers.Handler.Click(
                this, callbacks, this.handlerOptions.click || {});
        }
    },
    showContextMenu: function(evt) {
        var contextMenu = new Ext.menu.Menu({
            items:[{
                text: 'foo'
            }, {
                text: 'bar'
            }]
        });
        contextMenu.showAt([evt.clientX, evt.clientY]);
    }
});

var app = new gxp.Viewer({
    portalConfig: {
        layout: "border",
        region: "center",
        
        // by configuring items here, we don't need to configure portalItems
        // and save a wrapping container
        items: [{
            id: "centerpanel",
            xtype: "panel",
            layout: "fit",
            region: "center",
            border: false,
            items: ["mymap"]
        }, {
            id: "westpanel",
            xtype: "container",
            layout: "fit",
            region: "west",
            width: 200
        }],
        bbar: {id: "mybbar"}
    },
    
    // configuration of all tool plugins for this application
    tools: [{
        ptype: "gxp_layertree",
        outputConfig: {
            id: "tree",
            border: true,
            tbar: [] // we will add buttons to "tree.bbar" later
        },
        outputTarget: "westpanel"
    }, {
        ptype: "gxp_addlayers",
        actionTarget: "tree.tbar"
    }, {
        ptype: "gxp_removelayer",
        actionTarget: ["tree.tbar", "tree.contextMenu"]
    }, {
        ptype: "gxp_zoomtoextent",
        actionTarget: "map.tbar"
    }, {
        ptype: "gxp_zoom",
        actionTarget: "map.tbar"
    }, {
        ptype: "gxp_navigationhistory",
        actionTarget: "map.tbar"
    }, {
        ptype: "gxp_wmsgetfeatureinfo",
        actionTarget: "map.tbar"
    }],
    
    // layer sources
    sources: {
        local: {
            ptype: "gxp_wmscsource",
            url: "/geoserver/wms",
            version: "1.1.1"
        },
        osm: {
            ptype: "gxp_osmsource"
        }
    },
    
    // map and layers
    map: {
        id: "mymap", // id needed to reference map in portalConfig above
        title: "Map",
        projection: "EPSG:900913",
        center: [-10764594.758211, 4523072.3184791],
        zoom: 3,
        layers: [{
            source: "osm",
            name: "mapnik",
            group: "background"
        }, {
            source: "local",
            name: "opengeo:countries",
            selected: true
        }],
        items: [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }]
    }

});
