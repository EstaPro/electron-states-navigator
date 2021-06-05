import StatesService from 'atm-states'
import settings from 'electron-settings'
import { ipcRenderer as ipc } from 'electron'
import vis from 'vis'
import { log } from 'util';
const statesColorMap = require('../css/statesColor.json');

console.log(statesColorMap);


let $ = require('jquery');

const electron = require('electron')
const BrowserWindow = electron.remote.BrowserWindow


class StatesGraph{
  constructor(){
    //this.states = new StatesService(settings);
    this.states = new StatesService();

    this.options = {
      nodes:{
        size: 160,
        shape: 'box',
        font: {size: 32, face: 'monospace', align: 'center'},
        heightConstraint: { minimum: 100 },
        widthConstraint: { minimum: 100 },
      },
      edges: {
        smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
      },
      layout: {
        hierarchical: { direction: 'UD', levelSeparation: 160, nodeSpacing: 160 }
      },
      interaction:{
        hover: true,
        hoverConnectedEdges: true,
        keyboard: {
          enabled: true,
          speed: {x: 10, y: 10, zoom: 0.03}
        },
        multiselect: true,
        navigationButtons: true
      },
      manipulation: {
        enabled: true,
        initiallyActive: true,
        addNode: true,
        addEdge: true,
        editEdge: true,
        deleteNode: true,
        deleteEdge: true
      },
      physics: false,
    }
  }

  /**
   * [processStatesData description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  processStatesData(data){

    console.log('Loading States data...');
    data.forEach( state => {
      this.states.addState(state);
    });

    console.log('States data processed.');
  }

  /**
   * [getNodes prepare graph nodes and apply some styles]
   * @return {[type]} [description]
   */
  getNodes(){
    this.nodes = this.states.getNodes();
    
    this.nodes.forEach(node => {
      let stateType = graphStates.states.get(node.id).type;
      node['color'] = statesColorMap[stateType];
    })
  }

  /**
   * [getEdges prepare graph edges and apply some styles]
   * @return {[type]} [description]
   */
  getEdges(){
    this.edges = this.states.getEdges()
    this.edges.forEach( edge => {
      edge['arrows'] = 'to';
      edge['physics'] = false;
      edge['smooth'] = {'type': 'cubicBezier'};
    });
  }

  /**
   * [center description]
   * @return {[type]} [description]
   */
  center(state_number){
    if(!state_number)
      state_number = '000'
    
    let state = this.states.get(state_number);

    if(!state)
    {
      console.log("State <"+ state_number +"> not Found!");
      return;
    }

    this.graph.focus(
      state_number, 
      { scale: 0.5, offset: {}, animation: {duration: 500, easingFunction: "easeInOutQuad"} }
    );  
    this.graph.selectNodes([state_number,]);

    console.log(state);
  }

  /**
   * [zoomIn description]
   * @return {[type]} [description]
   */
  zoomIn(){
    let newScale = this.graph.getScale() + 0.03;
    let options = {
      scale: newScale,
      animation: {
        duration: 500,
        easingFunction: "easeInOutQuad"
      }
    };

    this.graph.moveTo(options);
  }

  /**
   * [zoomOut description]
   * @return {[type]} [description]
   */
  zoomOut(){
    let newScale = this.graph.getScale() - 0.03;
    let options = {
      scale: newScale,
      animation: {
        duration: 500,
        easingFunction: "easeInOutQuad"
      }
    };

    this.graph.moveTo(options);
  }

    /**
   * [zoomAll description]
   * @return {[type]} [description]
   */
  zoomAll(){
    let options = {
      animation: {
        duration: 500,
        easingFunction: "easeInOutQuad"
      }
    };

    this.graph.fit(options);
  }

  /**
   * [redraw description]
   * @return {[type]} [description]
   */
  redraw(){
    console.log("Drawing Loaded States...");
    this.getNodes();
    this.getEdges();

    this.container = document.getElementById('mynetwork');
    console.log('nodesLength',this.nodes.length);
    this.graph = new vis.Network(
      this.container, 
      {'nodes': this.nodes, 'edges': this.edges}, 
      this.options
    );

    this.graph.on("doubleClick", (items)=>{
      let stateNum = items.nodes[0];
      if(stateNum)
      {
        console.log('Node <'+ stateNum +'> Clicked');
        let state = this.states.get(stateNum);
        console.log('StateNumber <'+ stateNum +'> Retrieved');
        this.center(stateNum);

        console.log("docPath");
        console.log(state.docPath);

        $('#stateNum').text(stateNum);
        $('#stateType').text(state.type);
        $('#stateType').attr('href', state.docPath);
      
        let formString = String('\
        <div class="form-group" id="formGroup">\
          <label for="idEntry">entryLabel</label>\
          <input type="number" maxlength="3" minlength="3" class="form-control" id="idEntry" value="entryValue" placeholder="">\
        </div>\
        ');
        $("#modalForm").text('');
        
        state.entries.forEach((entry) => {
          let idEntry = entry[0];
          let label = String(idEntry.replace(/_/g, ' ')).toUpperCase();
          let newForm = formString.replace(/entryLabel/g, label);
          newForm = newForm.replace(/idEntry/g, idEntry);
          newForm = newForm.replace(/entryValue/g, entry[1]);
          $("#modalForm").append(newForm);
        });

        $("#saveBtn").click(()=>{
          let updateState = $('#stateNum').text()
          console.log("Save State <"+ updateState +'>');
          console.log(this.states.get(updateState));

          this.states.get(updateState).entries.forEach((entry)=>{
            let newVal = $('#'+entry[0]).val();
            entry[1] = newVal;
          });
        });

        $('#myModal').modal();
      }
      else 
        console.log("No State Clicked");
    });

    this.center();
  }
}

let graphStates = new StatesGraph();

ipc.on('graph-update-states', (event, data) => {
  graphStates.processStatesData(data);
  graphStates.redraw();
});


ipc.on('graph-center-states', (event, state) => {
    graphStates.center(state);
});

ipc.on('graph-zoom-in', (event) => {
  graphStates.zoomIn();
});

ipc.on('graph-zoom-out', (event) => {
  graphStates.zoomOut();
});

ipc.on('graph-zoom-all', (event) => {
  graphStates.zoomAll();
});
