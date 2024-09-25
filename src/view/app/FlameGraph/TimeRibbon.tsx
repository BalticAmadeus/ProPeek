import { Box } from "@mui/material";
import * as React from "react";
import { useEffect, useState } from "react";
import { VictoryAxis } from "victory-axis";

interface TimeRibbonProps {
  startValue?: number;
  endValue?: number;
}

const TimeRibbon: React.FC<TimeRibbonProps> = ({
  startValue = 0,
  endValue = 1,
}) => {
  const [axisWidth, setAxisWidth] = useState<number>(0);

  const [numberOfTicks, setNumberOfTicks] = useState<number>(7);

  const updateNumberOfTicks = (width: number) => {
    setNumberOfTicks(Math.floor(width / 200) + 1);
  };

  const updateWidth = (ev: Event) => {
    const target = ev.target as Window;
    setAxisWidth(target.innerWidth);

    updateNumberOfTicks(target.innerWidth);
  };

  // This hook is used for having a fixed height and responsive width
  // code taken from: https://github.com/FormidableLabs/victory/issues/396#issuecomment-348182325
  useEffect(() => {
    setAxisWidth(window.innerWidth);
    updateNumberOfTicks(window.innerWidth);

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const generateTickValuesIncludingLastDomainValue = (
    domain: [number, number],
    desiredTickCount: number
  ) => {
    const [start, end] = domain;
    let tickValues = [];

    const range = Math.abs(end - start);
    const fixedNum = `${Math.floor(1 / range)}`.length + 1;

    const step = range / (desiredTickCount - 1);
    for (let i = 0; i < desiredTickCount; i++) {
      tickValues.push(
        parseFloat((start + step * i).toFixed(fixedNum > 2 ? fixedNum : 2))
      );
    }

    if (tickValues[tickValues.length - 1] !== end) {
      tickValues[tickValues.length - 1] = parseFloat(end.toFixed(7));
    }

    return tickValues;
  };

  // Workaround to apply the text-anchor="end" value to the last tick label so it's not hidden.
  useEffect(() => {
    const ribbonSvg = document.getElementById("timeRibbon");

    const ticks = (ribbonSvg.children[0] as Element).getElementsByTagName("g");

    for (let i = 0; i < ticks.length; i++) {
      const label = ticks[i].getElementsByTagName("tspan")[0] as Element;

      label.setAttribute(
        "text-anchor",
        i === numberOfTicks - 1 ? "end" : "middle"
      );
    }
  }, [numberOfTicks]);

  return (
    <Box>
      <svg
        id="timeRibbon"
        viewBox={`0 0 ${axisWidth} 50`}
        preserveAspectRatio="none"
        width="100%"
      >
        <VictoryAxis
          tickValues={generateTickValuesIncludingLastDomainValue(
            [startValue, endValue],
            numberOfTicks
          )}
          tickFormat={(t) => `${t}s`}
          crossAxis={false}
          standalone={false}
          width={axisWidth}
          height={50}
          domain={[startValue, endValue]}
          padding={{ top: 32, bottom: 32, left: 8, right: 8 }}
          style={{
            axis: { stroke: "var(--vscode-input-foreground)" }, // Customize axis color
            tickLabels: {
              fill: "var(--vscode-input-foreground)",
              fontSize: 11,
              padding: 5,
            },
            ticks: { stroke: "var(--vscode-input-foreground)", size: 5 }, // Customize tick color and size
          }}
        />
      </svg>
    </Box>
  );
};

export default TimeRibbon;
