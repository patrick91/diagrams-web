import type { NextPage } from "next";
import Head from "next/head";
import Script from "next/script";
import React from "react";

import { Header } from "../components/header";
import { Editor } from "../components/editor";
import { PyodideViz } from "../components/pyodide-viz";
import { Loading } from "../components/loading";

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

const Home: NextPage = () => {
  const [loading, setLoading] = React.useState(true);

  return (
    <div>
      <Script
        defer
        data-domain="diagrams-web.vercel.app"
        src="https://plausible.io/js/plausible.js"
      ></Script>

      <PyodideViz code={DEFAULT_CODE} onLoad={() => setLoading(false)} />

      <Head>
        <title>Diagrams</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="grid grid-cols-2">
        <div className="overflow-y-scroll border-r">
          <Editor
            defaultCode={DEFAULT_CODE}
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
