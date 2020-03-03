// This code is released under the Creative Commons zero license.  Go wild, but
// it would be nice to preserve the credit if you find it helpful.
//
// Tom Sgouros
// Center for Computation and Visualization
// Brown University
// March 2018.

import 'normalize.css';

import Workbench from 'paraviewweb/src/Component/Native/Workbench';
import ToggleControl from 'paraviewweb/src/Component/Native/ToggleControl';
import BGColor from 'paraviewweb/src/Component/Native/BackgroundColor';
import Spacer from 'paraviewweb/src/Component/Native/Spacer';
import Composite from 'paraviewweb/src/Component/Native/Composite';
import ReactAdapter from 'paraviewweb/src/Component/React/ReactAdapter';
import WorkbenchController from 'paraviewweb/src/Component/React/WorkbenchController';
import NumberSliderWidget from 'paraviewweb/src/React/Widgets/NumberSliderWidget';
import { debounce } from 'paraviewweb/src/Common/Misc/Debounce';

import RemoteRenderer from 'paraviewweb/src/NativeUI/Canvas/RemoteRenderer';
import SizeHelper from 'paraviewweb/src/Common/Misc/SizeHelper';
import ParaViewWebClient from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';

import * as React from "react";
import * as ReactDOM from "react-dom";

import SmartConnect from 'wslink/src/SmartConnect';

// This URL and port number are determined when you invoke the server.
// See python/PVWSDServer.py for instructions.
const config = { sessionURL: 'ws://localhost:1234/ws' };

// We'll use that config object to create a connection to the
// pvpython-run server.
const smartConnect = SmartConnect.newInstance({ config });

type Model = {pvwClient: any};

// This is just a global object we can use to attach data to, in order to
// access it from other scopes.
var model: Model = {pvwClient: null};

// This is a hash of functions that return protocols.  For this example, we
// have only one, called 'pvwsdService'.  You could have more than one, though
// I'm not sure why you'd need that.
const pvwsdProtocols = {
  pvwsdService: (session: any) => {

    // We return a hash of functions, each of which invokes an RPC call.  The
    // 'session.call' function takes the name of an remote procedure and a list
    // of arguments.
    return {
      changeColor: (arg1: string, arg2: string) => {
        // The string here exactly matches a string in the @exportRPC decorator
        // in the PVWSDProtocols.py file.  Note that the RPC names must be
        // lower case only.  This is a limitation of wslink, I believe.
        session.call('pvwsdprotocol.change.color', [ arg1, arg2 ])
          .then((result: any) => console.log('result: ' + result));
        console.log("******* pressed Change Color *******");
      },

      showCone: () => {
        session.call('pvwsdprotocol.show.cone', [])
          .then((result: any) => console.log('result' + result));
        console.log("******* pressed Show Cone *******");
      },

      hideCone: () => {
        session.call('pvwsdprotocol.hide.cone', [])
          .then((result: any) => console.log('result' + result));
        console.log("******* pressed Hide Cone *******");
      },

      changeSides: (N: number) => {
        session.call('pvwsdprotocol.change.sides', [ N ])
          .then((result: any) => console.log('result: ' + result));
        console.log("******* adjusted number of sides ********");
      },
    };
  },
};

type PanelState = {
  // The state of the controls is really just the N on the slider.  There is
  // also a state for the visibility of the cone, but this is tracked on the
  // server.
  n: number;
};

class PVWSDControlPanel extends React.Component<{}, PanelState> {
  state: PanelState = {n: 12};

  constructor(props: {}) {
    super(props);
    this.updateVal = this.updateVal.bind(this);
  }

  updateVal(e: any) {
    // What changes, and what value?
    const which: string = e.target.name;
    const newVal: number = e.target.value;
    console.log("updateval: ", which, " ", newVal);

    // Update the new value in the display.
    this.setState({n: newVal});

    console.log(typeof e.target.value);
    // Communicate it to the server.
    model.pvwClient.pvwsdService.changeSides(e.target.value);
  }

  render() {
    return (
            <div style={{width: '100%', display: 'table'}}>
              <div style={{display: 'table-cell'}}>
                <button onClick={() => model.pvwClient.pvwsdService.changeColor('pink','purple')}>Change Color</button>
                <button onClick={() => model.pvwClient.pvwsdService.showCone()}>Show Cone</button>
                <button onClick={() => model.pvwClient.pvwsdService.hideCone()}>Hide Cone</button>
              </div>
              <div style={{display: 'table-cell'}}>
                <NumberSliderWidget value={this.state.n}
                                    max="100" min="3" onChange={this.updateVal} name="n"/>
              </div>
            </div>
           );
  }
}

type RenderWindowProps = {
  connector: any,
}

class PVWSDRenderWindow extends React.Component<RenderWindowProps, {}> {
  private pvTarget = React.createRef<HTMLDivElement>();
  private renderer: any = null; // RemoteRenderer
  private connector: any;

  constructor(props: RenderWindowProps) {
    super(props);
    this.connector = props.connector;
    console.log("CONNECT", this.connector);

    // Create a callback to be executed when the connection is made.
    this.connector.onConnectionReady((connection: any) => {
      // The createClient method takes a connection, a list of predefined protocols
      // to use, and a function that returns
      model.pvwClient =
        ParaViewWebClient.createClient(connection,
                                       [
                                         'MouseHandler',   // <--- These are pre-defined.
                                         'ViewPort',
                                         'ViewPortImageDelivery',
                                       ],
                                       pvwsdProtocols);    // <-- These are yours.

      const targetWindow = this.pvTarget.current;

      // Now build the HTML element that will display the goods.
      this.renderer = new RemoteRenderer(model.pvwClient);
      this.renderer.setContainer(targetWindow);
      this.renderer.onImageReady(() => {
        console.log('image ready (for next command)');
      });
      // const renderer = this.renderer;
      SizeHelper.onSizeChange(() => {this.renderer.resize();});
      this.renderer.render();
      SizeHelper.startListening();
    });
  }

  componentDidMount() {
    if (this.renderer != null) {
      this.renderer.render();
    } else {
      console.log("DIDMOUNT: null");
    }
  }

  render() {
    return (
        <div style={{height: "120vw",
                     width: "120vh",
                     overflow: "hidden",
                     position: "relative"}}
             ref={this.pvTarget}>FooHah2</div>);
  }
}

class PVWSDApp extends React.Component {
  render() {
    const e = React.createElement
    return e('div', null,
             (<PVWSDControlPanel />),
             e(PVWSDRenderWindow, {connector: smartConnect}));
  }
}

ReactDOM.render(<PVWSDApp />,
                document.getElementById('demo'));

// Let 'er rip.
smartConnect.connect();
