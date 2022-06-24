import type { NextPage } from "next";
import Head from "next/head";
import Script from "next/script";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import React from "react";
import { resources } from "../lib/resources";

// @ts-ignore
import Viz from "viz.js";
// @ts-ignore
import { Module, render } from "viz.js/full.render";

const PRE_CODE = `
import diagrams

from diagrams import Diagram as BaseDiagram, setdiagram
from diagrams.aws.compute import EC2
from diagrams.aws.database import RDS
from diagrams.aws.network import ELB

import js

class Diagram(BaseDiagram):
    def render(self):
        js.renderDot(
          str(self.dot).replace("/lib/python3.10/site-packages/resources/", "https://github.com/mingrammer/diagrams/raw/master/resources/")
        )


    def __exit__(self, exc_type, exc_value, traceback):
        self.render()
        setdiagram(None)
`;

const DEFAULT_CODE = `
with Diagram("Grouped Workers", show=False, direction="TB"):
    ELB("lb") >> [EC2("worker1"),
                  EC2("worker2"),
                  EC2("worker3"),
                  EC2("worker4"),
                  EC2("worker5")] >> RDS("events")
`.trim();

const renderDiagram = async (pythonCode: string) => {
  // @ts-ignore
  await window.pyodide.runPythonAsync(PRE_CODE + pythonCode);
};

function Editor() {
  // todo: debounce this
  const onChange = React.useCallback((value: string) => {
    renderDiagram(value);
  }, []);

  return (
    <CodeMirror
      value={DEFAULT_CODE}
      height="100vh"
      extensions={[python()]}
      onChange={onChange}
    />
  );
}

const Home: NextPage = () => {
  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js"
        onLoad={async () => {
          let viz = new Viz({ Module, render });

          const renderDot = (dot: string) => {
            viz
              .renderSVGElement(dot, {
                images: resources.map(([name, width, height]) => ({
                  path: `https://github.com/mingrammer/diagrams/raw/master/resources/${name}`,
                  width,
                  height,
                })),
              })
              .then(function (element: SVGElement) {
                document.querySelector("#chart")!.replaceChildren(element);
              })
              .catch((error: any) => {
                // Create a new Viz instance (@see Caveats page for more info)
                viz = new Viz({ Module, render });

                // Possibly display the error
                console.error(error);
              });
          };

          // @ts-ignore
          window.renderDot = renderDot;
          // @ts-ignore
          window.pyodide = await loadPyodide();

          // @ts-ignore
          await window.pyodide.loadPackage(["micropip"]);

          // @ts-ignore
          await window.pyodide.runPythonAsync(`
            import micropip
            await micropip.install('diagrams')
          `);

          await renderDiagram(DEFAULT_CODE);
        }}
      />
      <Head>
        <title>Diagrams</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grid grid-cols-2">
        <div className="overflow-y-scroll h-screen border-r">
          <Editor />
        </div>

        <div id="chart"></div>
      </div>
    </div>
  );
};

export default Home;
