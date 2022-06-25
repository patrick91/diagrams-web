import { Editor } from "../components/editor";
import { Loading } from "../components/loading";
import { useRender } from "../components/pyodide-viz";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo } from "react";

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

export const EditorWithPreview = ({}) => {
  const [rendering, setRendering] = useState(false);
  const [loading, setLoading] = useState(false);

  const { renderDiagram } = useRender({
    onLoadStart: () => {
      setLoading(true);
    },
    onLoad: async () => {
      setLoading(false);

      await renderDiagram(DEFAULT_CODE);
    },
  });

  const onChange = useMemo(() => {
    return debounce(async (code: string) => {
      setRendering(true);
      await renderDiagram(code);
      setRendering(false);
    }, 100);
  }, [renderDiagram]);

  return (
    <div className="grid grid-cols-2">
      <div className="overflow-y-scroll border-r">
        <Editor defaultCode={DEFAULT_CODE} onChange={onChange} />
      </div>

      <div className="relative">
        {(loading || rendering) && <Loading />}

        <div id="chart"></div>
      </div>
    </div>
  );
};
