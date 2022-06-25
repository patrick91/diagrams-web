import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import React, { useMemo } from "react";

// @ts-ignore
import debounce from "lodash.debounce";
import { renderDiagram } from "../lib/render";

export const Editor = ({
  onBeforeRender,
  onAfterRender,
  defaultCode,
}: {
  defaultCode: string;
  onBeforeRender?: () => void;
  onAfterRender?: () => void;
}) => {
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
      value={defaultCode}
      height="calc(100vh - 58px)"
      extensions={[python()]}
      onChange={onChange}
    />
  );
};
