import Script from "next/script";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import Viz from "viz.js";
// import { renderDiagram } from "../lib/render";
import { resources } from "../lib/resources";

let renderDiagram = async (code: string) => {};

const PRE_CODE = `
import diagrams

if not hasattr(diagrams, "DiOriginalDiagramagram"):
    diagrams.OriginalDiagram = diagrams.Diagram

_diagram = None

class Diagram(diagrams.OriginalDiagram):
    def render(self):
        global _diagram

        _diagram = str(self.dot).replace(
            "/lib/python3.10/site-packages/resources/",
            "https://github.com/mingrammer/diagrams/raw/master/resources/"
        )

    def __exit__(self, exc_type, exc_value, traceback):
        self.render()
        diagrams.setdiagram(None)

diagrams.Diagram = Diagram
`;

const POST_CODE = `_diagram`;

export const useRender = ({
  onLoad,
  onLoadStart,
}: {
  onLoadStart: () => void;
  onLoad: () => Promise<void>;
}) => {
  // there's probably a better way for doing this, but I'll investigate later
  // @ts-ignore
  if (typeof window !== "undefined" && !window.pyodide) {
    onLoadStart();

    // @ts-ignore
    window.pyodide = true;

    let viz = new Viz({ workerURL: "/js/lite.render.js" });

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
          viz = new Viz({ workerURL: "/js/lite.render.js" });

          // Possibly display the error
          console.error(error);
        });
    };

    const pyodideWorker = new Worker("/js/pyodide.worker.js");

    const callbacks: any = {};

    pyodideWorker.onmessage = (event) => {
      if (event.data.ready) {
        onLoad();

        return;
      }

      const { id, ...data } = event.data;
      const onSuccess = callbacks[id];
      delete callbacks[id];
      onSuccess(data);
    };

    const asyncRun = (() => {
      let id = 0; // identify a Promise
      return (pythonCode: string) => {
        // the id could be generated more carefully
        id = (id + 1) % Number.MAX_SAFE_INTEGER;
        return new Promise((onSuccess) => {
          callbacks[id] = onSuccess;
          pyodideWorker.postMessage({
            python: PRE_CODE + pythonCode + "\n" + POST_CODE,
            id,
          });
        });
      };
    })();

    renderDiagram = async (code: string) => {
      try {
        // @ts-ignore
        const { results, error } = await asyncRun(code);

        if (results) {
          renderDot(results);
        } else if (error) {
          console.error("pyodideWorker error: ", error);
        }
      } catch (e) {
        console.log(
          // @ts-ignore
          `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
        );
      }
    };
  }

  return {
    renderDiagram,
  };
};
