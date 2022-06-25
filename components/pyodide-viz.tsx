import Script from "next/script";
// @ts-ignore
import Viz from "viz.js";
import { renderDiagram } from "../lib/render";
import { resources } from "../lib/resources";

export const PyodideViz = ({
  code,
  onLoad,
}: {
  code: string;
  onLoad: () => void;
}) => {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js"
        onLoad={async () => {
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
                // Create a new Viz instance (@see Caveats page for more info)
                viz = new Viz({ workerURL: "/js/lite.render.js" });

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

          await renderDiagram(code);

          onLoad();
        }}
      />
    </>
  );
};
