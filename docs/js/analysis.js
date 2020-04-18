/* General vars */
var border_colour_init = "#D3D3D3";
var border_colour_selected = "#000000";
var border_colour_linked = "#A52A2A";
var edge_colour_init = "#F0F8FF";
var edge_colour_linked = "#87CEEB";
var node_colour_1 = "#cccccc";
var node_colour_2 = "#a8d1ff";
var node_colour_3 = "#1e88ff";
var node_colour_4 = "#003d82";

var all_data = [];
$.get("data/metadata.json", function(data) {
    $.each(data, function(idx, v) {
      all_data.push({data: v});
    });
    $.get("data/citations.json", function(data) {
        $.each(data, function(idx, v) {
          all_data.push({data: v});
        });
        create_graph(all_data);
    });
});


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


function create_graph(data) {
  var cy = cytoscape({
    container: document.getElementById('cy'), // container to render in

    elements: data,

    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': function(ele) {return select_node_color(ele.data("year"))},
          'border-color': border_colour_init,
          'border-width': 4,
          'shape': function(ele) {return select_node_shape(ele.data("count"))}
        },
      },

      {
        selector: 'edge',
        style: {
          'width': 1,
          'curve-style': 'haystack',
          'line-color': edge_colour_init
        }
      }
    ],

    layout: {
      name: 'concentric'
    }

  });
  
  cy.on('tap', 'node', function(evt){
      cy.nodes().style('border-color', border_colour_init);
      cy.edges().style('line-color', edge_colour_init);
      
      var node = evt.target;
      node.style('border-color', border_colour_selected);
      node.neighborhood().style('border-color', border_colour_linked);
      node.connectedEdges().style("line-color", edge_colour_linked)
      
      $("#ref").text(node.data("author") + " (" + node.data("year") + "). " + node.data("title") + ". ");
      $("#ref").append("<em>" + node.data("source_title") + ". </em>");
      $("#ref").append("<a target='_blank' href='https://doi.org/" + node.data("id") + "'>https://doi.org/" + node.data("id") + "</a>");
      $("#cited").text("Cited by " + node.data("count") + " bibliographic resources.");
    });
    
  cy.on('tap', function(event){
      var evtTarget = event.target;

      if( evtTarget === cy ){
        cy.nodes().style('border-color', border_colour_init);
        cy.edges().style('line-color', edge_colour_init);
        $("#ref").text("None selected");
        $("#cited").text("");
      }
    });
}
