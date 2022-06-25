import type { NextPage } from "next";
import Head from "next/head";
import Script from "next/script";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import React, { useMemo } from "react";
import { resources } from "../lib/resources";

// @ts-ignore
import Viz from "viz.js";
// @ts-ignore
import debounce from "lodash.debounce";
import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-indigo-600">
      <nav className="px-4" aria-label="Top">
        <div className="w-full py-2 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <a className="font-bold text-white">Diagrams web</a>
            </Link>
          </div>
          <div className="ml-10 space-x-4">
            <a
              href="https://github.com/patrick91/diagrams-web"
              className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

const PRE_CODE = `
import diagrams

if not hasattr(diagrams, "DiOriginalDiagramagram"):
    diagrams.OriginalDiagram = diagrams.Diagram

import js

class Diagram(diagrams.OriginalDiagram):
    def render(self):
        js.renderDot(
          str(self.dot).replace("/lib/python3.10/site-packages/resources/", "https://github.com/mingrammer/diagrams/raw/master/resources/")
        )


    def __exit__(self, exc_type, exc_value, traceback):
        self.render()
        diagrams.setdiagram(None)

diagrams.Diagram = Diagram
`;

const DEFAULT_CODE = `
from diagrams.aws.compute import EC2
from diagrams.aws.database import RDS
from diagrams.aws.network import ELB

with Diagram("Grouped Workers"):
    ELB("lb") >> [EC2("worker1"),
                  EC2("worker2"),
                  EC2("worker3"),
                  EC2("worker4"),
                  EC2("worker5")] >> RDS("events")
`.trim();

const Loading = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400 absolute top-2 right-2"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const renderDiagram = async (pythonCode: string) => {
  // @ts-ignore
  await window.pyodide.runPythonAsync(PRE_CODE + pythonCode);
};

function Editor({
  onBeforeRender,
  onAfterRender,
}: {
  onBeforeRender?: () => void;
  onAfterRender?: () => void;
}) {
  const onChange = useMemo(() => {
    return debounce(async (value: string) => {
      if (onBeforeRender) {
        onBeforeRender();
      }

      await renderDiagram(value);

      if (onAfterRender) {
        onAfterRender();
      }
    }, 300);
  }, [onAfterRender, onBeforeRender]);

  return (
    <CodeMirror
      value={DEFAULT_CODE}
      height="calc(100vh - 58px)"
      extensions={[python()]}
      onChange={onChange}
    />
  );
}

const Home: NextPage = () => {
  const [loading, setLoading] = React.useState(true);

  return (
    <div>
      <Script
        defer
        data-domain="diagrams-web.vercel.app"
        src="https://plausible.io/js/plausible.js"
      ></Script>

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

          await renderDiagram(DEFAULT_CODE);

          setLoading(false);
        }}
      />
      <Head>
        <title>Diagrams</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      <div className="grid grid-cols-2">
        <div className="overflow-y-scroll border-r">
          <Editor
            onBeforeRender={() => setLoading(true)}
            onAfterRender={() => setLoading(false)}
          />
        </div>

        <div className="relative">
          {loading && <Loading />}

          <div id="chart"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
