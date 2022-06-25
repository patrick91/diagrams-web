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

export const renderDiagram = async (pythonCode: string) => {
  // @ts-ignore
  await window.pyodide.runPythonAsync(PRE_CODE + pythonCode);
};
