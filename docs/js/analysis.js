/* General vars */
var border_colour_init = "#D3D3D3";
var border_colour_selected = "#000000";
var border_colour_reference = "#F08080";
var border_colour_citation = "#87CEEB";
var edge_colour_reference = "#F08080";
var edge_colour_citation = "#87CEEB";
var node_colour_1 = "#cccccc";
var node_colour_2 = "#a8d1ff";
var node_colour_3 = "#1e88ff";
var node_colour_4 = "#003d82";
var basic_z_index_node = 20;
var basic_z_index_edge = 10;
var higher_z_index_node = 30;


var author_set = new Set();
var all_data = [];
var cy = null;  // where the cytoscape graph will be stored
var node_selected = null;
var visible_authors = new Set();

$(document).keypress(
  function(event){
    if (event.which == '13') {
      filter_author();
      event.preventDefault();
    }
});

$.get("data/metadata.json", function(data) {
    $.each(data, function(idx, v) {
      all_data.push({data: v});
      $.each(v.author.split(", "), function(jdx, a) {
          author_set.add(a.toLowerCase().replace(/^\s+|\s+$/g, ''));
      });
    });
    $.get("data/citations.json", function(data) {
        $.each(data, function(idx, v) {
          all_data.push({data: v});
        });
        create_graph(all_data);
    });
});

function redraw_authors() {
    if (visible_authors.size == 0) {
        cy.nodes().style("visibility", "visible");
        select_node(node_selected);
    } else {
        var array_visible_authors = Array.from(visible_authors);
        cy.nodes().filter(function (n, idx) {
            if (_.isEmpty(_.intersection(n.data("author").toLowerCase().split(", "), array_visible_authors))) {
                n.style("visibility", "hidden");
            } else {
                n.style("visibility", "visible");
            }
        });
        select_node(node_selected);
    }
}

function filter_author() {
    var author_to_filter = document.getElementById("authorToFilter").value.toLowerCase().replace(/^\s+|\s+$/g, '');
    if (author_to_filter !== "") {
        if (author_set.has(author_to_filter)) {
            $("#notauthor").hide();
            if (!visible_authors.has(author_to_filter)) {
                visible_authors.add(author_to_filter);
                document.getElementById("authorToFilter").value = null;
                $("#authortag").append("<span id='" + author_to_filter + "'>" + author_to_filter + "<button class='pure-button' onclick='remove_author(\"" + author_to_filter + "\")' title='click to remove the author'>X</button></span>");
                var array_visible_authors = Array.from(visible_authors);
                cy.nodes().filter(function (n, idx) {
                    if (_.isEmpty(_.intersection(n.data("author").toLowerCase().split(", "), array_visible_authors))) {
                        n.style("visibility", "hidden");
                    } else {
                        n.style("visibility", "visible");
                    }
                });
                select_node(node_selected);
            }
        } else {
            $("#notauthor").show();
        }
    }
}

function remove_author(button_id) {
    $("#" + button_id).remove();
    visible_authors.delete(button_id);
    document.getElementById("authorToFilter").value = "";
    $("#notauthor").hide();
    redraw_authors();
}

function clear_all() {
    for (let author of visible_authors) {
        $("#" + author).remove();
        visible_authors.delete(author);
    }
    document.getElementById("authorToFilter").value = "";
    $("#notauthor").hide();
    redraw_authors();
}

function select_node_color(y) {
    var yi = parseInt(y);
    if (yi >= 2020) {
        return node_colour_4;
    } else if (yi < 2020 && yi >= 2012) {
        return node_colour_3;
    }  else if (yi < 2012 && yi >= 2003) {
        return node_colour_2;
    } else {
        return node_colour_1;
    }
}

function select_node_shape(cc) {
    var cci = parseInt(cc);
    if (cci <= 10) {
        return "circle";
    } else if (cci <= 100) {
        return "diamond";
    }  else if (cci <= 500) {
        return "pentagon";
    } else {
        return "star";
    }
}

function select_label(n) {
    var label = "";
    var author = n.data("author");
    var comma_idx = author.indexOf(', ');
    if (comma_idx != -1) {
        label += author.substr(0, author.indexOf(', ')) + " et al.";
    } else {
        label = author;
    }
    return label + " (" + n.data("year") + ")"; 
}


function nodes_visible(e) {
    return e.source().visible() && e.target().visible();
}


function select_node(node) {
    if (node !== null) {
        node_selected = node;
        cy.nodes().style('border-color', border_colour_init);
        cy.edges().style("visibility", "hidden");

        var node_id = node.data("id");
        var visible_edges = node.connectedEdges(nodes_visible);
        var citation_edges = visible_edges.filter('[target = "' + node_id + '"]');
        var reference_edges = visible_edges.filter('[source = "' + node_id + '"]');

        node.style('border-color', border_colour_selected);
        reference_edges.targets().style('border-color', border_colour_citation);
        citation_edges.sources().style('border-color', border_colour_reference);
        reference_edges.style("line-color", edge_colour_citation).style("visibility", "visible");
        citation_edges.style("line-color", edge_colour_reference).style("visibility", "visible");

        if (node.visible()) {
            $("#ref").text(node.data("author") + " (" + node.data("year") + "). " + node.data("title") + ". ");
            $("#ref").append("<em>" + node.data("source_title") + ". </em>");
            $("#ref").append("<a target='_blank' href='https://doi.org/" + node.data("id") + "'>https://doi.org/" + node.data("id") + "</a>");
            $("#cited").text("Cited by " + node.data("count") + " articles in the Coronavirus Open Citations dataset.");
        } else {
            default_vis();
        }
        
    }
}

function default_vis() {
    cy.nodes().style('border-color', border_colour_init);
    cy.edges().style("visibility", "hidden");
    node_selected = null;
    $("#ref").text("None selected");
    $("#cited").text("");
}

function create_graph(data) {
  cy = cytoscape({
    container: document.getElementById('cy'), // container to render in

    elements: data,

    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': function(ele) {return select_node_color(ele.data("year"))},
          'border-color': border_colour_init,
          'border-width': 4,
          'shape': function(ele) {return select_node_shape(ele.data("count"));},
          'z-index': basic_z_index_node
        }
      },

      {
        selector: 'edge',
        style: {
          'width': 1,
          'curve-style': 'haystack',
          'z-index': basic_z_index_edge,
          'visibility': 'hidden'
        }
      }
    ],

    layout: {
      name: 'concentric',
      levelWidth: function(nodes){
          return nodes.maxDegree() / 8;
      }
    },
    userZoomingEnabled: false,
    userPanningEnabled: false,
    selectionType: "single",
    autoungrabify: true

  });
  
  cy.on('tap', 'node', function(evt){
      var node = evt.target;
      select_node(node);
    });
    
  cy.on('tap', function(event){
      var evtTarget = event.target;

      if( evtTarget === cy ){
          default_vis();
      }
    });
  
    cy.on('mouseover', 'node', function(evt) {
        var n = evt.target;
        n.style("label", select_label(n));
        n.style("z-index", higher_z_index_node);
    });
    cy.on('mouseout', 'node', function(evt) {
        var n = evt.target;
        n.style("label", null);
        n.style("z-index", basic_z_index_node);
    });
}
