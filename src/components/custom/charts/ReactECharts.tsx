import * as React from 'react'
import {useEffect, useImperativeHandle, useMemo, useRef, forwardRef} from 'react'
import {getInstanceByDom, init, use} from "echarts/core";

type EChartsEventHandlers = {
  [key: string]: (params?: any) => void;
  zrClick?: (params?: any) => void;  // Made params optional with ?
};

import {cn} from "@/lib/utils";
import {getShadcnRgbaColor} from "@/lib/my-utils.js";

import {CanvasRenderer} from "echarts/renderers";
import {BarChart, LineChart, ScatterChart, FunnelChart} from "echarts/charts";
import {GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent, GraphicComponent} from "echarts/components";
import {useTheme} from "@/lib/theme-provider.js";

use([
  LegendComponent,
  ScatterChart,
  LineChart,
  BarChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  GraphicComponent,
  ToolboxComponent, // A group of utility tools, which includes export, data view, dynamic type switching, data area zooming, and reset.
  CanvasRenderer, // If you only need to use the canvas rendering mode, the bundle will not include the SVGRenderer module, which is not needed.
]);

const EChartsConfig = {
  bar: {
    shadow: {
      shadowColor: "rgba(0, 0, 0, 0.3)",
      shadowBlur: 2,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      borderRadius: [5, 5, 0, 0]
    },
    label: {
      show: true,
      position: 'top',
      formatter: '{c}'
    },
    maxWidth: 35,
  },
}

const UpdateChartWatermark = (text: string, color: any, z = 100, font = "normal 10px Arial") => {
  let color_ = color;
  if (!color_) {
    color_ = getShadcnRgbaColor('--foreground', 0.3);
  }

  let elements = [];
  for (let i = 0; i < text.length; i++) {
    elements.push({
      type: 'text',
      right: EChartsDefaultsOptions.grid.right,
      bottom: EChartsDefaultsOptions.grid.bottom + 5 + i * 12,
      style: {
        text: text[i],
        font: font,
        fill: color_,
      },
      z: z
    });
  }
  return ({elements: elements});
}

const EChartsDefaultsOptions = {
  grid: {
    right: 30,
    left: 50,
    top: 30,
    bottom: 30,
    containLabel: false
  },
  title: {
    show: false,
    text: "",
  },
  tooltip: {
    trigger: 'axis', // [axis, item]
    axisPointer: {
      type: 'shadow' // [shadow, line, cross]
    },
    renderMode: 'html',
    className: 'custom-echarts-tooltip',
    formatter: (params: any) => ChartTooltip({params: params, useSeriesColor: false}),
  },
  toolbox: {
    feature: {
      dataView: {show: false, readOnly: false},
      restore: {show: false},
      saveAsImage: {show: false}
    }
  },
  legend: {
    data: []
  },
  xAxis: [],
  yAxis: [],
  series: []
}

interface Props {
  options?: any;
  series?: any;
  chartSettings?: any;
  optionSettings?: any;
  className?: string;
  loading?: boolean;
  onEvents?: EChartsEventHandlers;
  watermark?: any;
}

const ReactECharts = forwardRef(({
                                   options,
                                   series = [],
                                   chartSettings = {useCoarsePointer: true}, // enables clicking near a line and still highlighting it
                                   optionSettings = {notMerge: true}, // don't merge two options together when updating option
                                   className = "h-[350px]",
                                   loading = false,
                                   onEvents,
                                   watermark,
                                   // theme = "light",
                                   ...props
                                 }: Props, ref) => {
  const chartRef = useRef(null)
  const {theme} = useTheme();

  useImperativeHandle(ref, () => ({
    getChartInstance: () => chartRef.current ? getInstanceByDom(chartRef.current) : null
  }));

  function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(0)

    const debouncedFn = useMemo(() => {
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          fn(...args)  // Make sure to pass the arguments to the original function
        }, delay)
      }
    }, [fn, delay])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    return debouncedFn
  }

  const DEBOUNCE_DELAY = 100; // 300ms delay for debouncing
  const resizeChart = useDebounce((..._args: any[]) => {
    if (chartRef.current) {
      const chart = getInstanceByDom(chartRef.current)
      if (chart) {
        chart.resize()
      }
    }
  }, DEBOUNCE_DELAY)

  useEffect(() => {
    if (typeof window === 'undefined' || !chartRef.current) return;

    const rafId = requestAnimationFrame(() => {
      // --------------------------------------------------------------------------------
      // Dispose old chart
      // --------------------------------------------------------------------------------
      if (chartRef.current) {
        const existing = getInstanceByDom(chartRef.current);
        if (existing) {
          existing.dispose();
        }
      }

      // --------------------------------------------------------------------------------
      // Init chart
      // --------------------------------------------------------------------------------
      const chart = init(chartRef.current, theme, chartSettings);

      // Apply option with theme
      // const colorCard = getShadcnRgbaColor('--card', -1);
      // const colorForeground = getShadcnRgbaColor('--foreground', 0.3);
      if (options) {
        // TODO: update option series shadow (when available)
        chart.setOption({
          ...EChartsDefaultsOptions,
          ...options,

          ...(watermark && {
            // graphic: UpdateChartWatermark(watermark, colorForeground),
          }),

          series: series,
          // backgroundColor: colorCard,
        }, optionSettings);
      }

      // --------------------------------------------------------------------------------
      // onEvents
      // --------------------------------------------------------------------------------
      if(onEvents) {
        Object.entries(onEvents).forEach(([event, handler]) => {
          if (handler && event !== 'zrClick') {  // Skip zrClick as it's handled separately
            chart.on(event, handler as (params: any) => void);
          }
        });

        if (onEvents.zrClick) {
          chart.getZr().on('click', onEvents.zrClick);
        }
      }

      // --------------------------------------------------------------------------------
      // Resize event listener
      // --------------------------------------------------------------------------------
      const resizeObserver = new ResizeObserver(() => {
        resizeChart()
      })

      // Ensure chartRef.current is not null before observing
      if (chartRef.current) {
        resizeObserver.observe(chartRef.current)
      }

      // Return cleanup function
      return () => {
        chart?.dispose()
        if (chartRef.current) {
          resizeObserver.unobserve(chartRef.current)
        }
        resizeObserver.disconnect()
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [theme]);

  useEffect(() => {
    if (chartRef.current) {
      const chart = getInstanceByDom(chartRef.current);
      if (chart) {
        loading ? chart.showLoading() : chart.hideLoading();
      }
    }
  }, [loading]);

  useEffect(() => {
    if (chartRef.current && series) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption({ ...options, series }, optionSettings);
    }
  }, [series]);

  // useEffect(() => {
  //   if (chartRef.current && option) {
  //     const chart = getInstanceByDom(chartRef.current);
  //     chart?.setOption(option, optionSettings);
  //   }
  // }, [series]);
  // }, [option]);

  return <div ref={chartRef} className={cn("h-full w-full", className)} {...props}/>
})

interface TooltipParam {
  seriesIndex?: number;
  name?: string;
  value?: any;
  marker?: string;
  seriesName?: string;
  color?: string;
}

interface ChartTooltipProps {
  params: TooltipParam[];
  showIndicators?: boolean;
  useSeriesColor?: boolean;
  className?: string;
}

const ChartTooltip = ({ params, showIndicators = true, useSeriesColor = false, className = "" }: ChartTooltipProps) => {
  const title = params.find(p => p.seriesIndex === 0)?.name ?? '';
  const tooltipClass = cn("flex flex-col gap-0 p-2 rounded-md border shadow-sm text-xs bg-popover/90", className);
  return `
    <div class="${tooltipClass}">
    <div class="font-bold text-popover-foreground">${title}</div>
      ${params.map(({name, value, marker, seriesName, color}) => `
        <div>
          <div class="flex flex-row gap-2 items-center">
            ${showIndicators ? marker : ''}
            <div class="font-medium ${!useSeriesColor ? 'text-muted-foreground' : ''}" style="${useSeriesColor ? `color: ${color};` : ''}">${seriesName || name}</div>
            <div class="text-foreground font-mono font-medium tabular-nums ml-auto">${Number(value).toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

interface ChartTooltipXYProps {
  params: {
    data: [number, number];
    seriesName: string;
    marker: string;
    dimensionNames: string[];
  };
  showIndicators?: boolean;
  className?: string;
}

const ChartTooltipXY = ({ params, showIndicators = true, className = "" }: ChartTooltipXYProps) => {
  const {data, seriesName, marker, dimensionNames} = params;
  const tooltipClass = cn("flex flex-col gap-0 p-2 rounded-md border shadow-sm text-xs bg-popover/90", className);

  return `
    <div class="${tooltipClass}">
      <div class="font-bold text-popover-foreground">${showIndicators ? marker : ''} ${seriesName}</div>
      <div class="flex flex-row gap-2 items-center">
        <div class="font-medium">${dimensionNames[0]}</div>
        <div class="text-foreground font-mono font-medium tabular-nums ml-auto">${Number(data[0]).toLocaleString()}</div>
      </div>
      <div class="flex flex-row gap-2 items-center">
        <div class="font-medium">${dimensionNames[1]}</div>
        <div class="text-foreground font-mono font-medium tabular-nums ml-auto">${Number(data[1]).toLocaleString()}</div>
      </div>
    </div>
  `
}

interface ChartTooltipSeriesProps {
  params: {
    data: any;
    seriesName: string;
    marker: string;
    dimensionNames: string[];
    name?: string;
  };
  showIndicators?: boolean;
  className?: string;
}

const ChartTooltipSeries = ({params, showIndicators = true, className = ""}: ChartTooltipSeriesProps) => {
  const {data, seriesName, marker, dimensionNames, name} = params;
  const tooltipClass = cn("flex flex-col gap-0 p-2 rounded-md border shadow-sm text-xs bg-popover/90", className);

  return `
    <div class="${tooltipClass}">
      <div class="font-bold text-popover-foreground">${showIndicators ? marker : ''} ${seriesName}</div>
      <div class="flex flex-row gap-2 items-center">
        <div class="font-medium">${name}</div>
        <div class="text-foreground font-mono font-medium tabular-nums ml-auto">${Number(data).toLocaleString()}</div>
      </div>
    </div>
  `
}
export {EChartsConfig, EChartsDefaultsOptions, ReactECharts, ChartTooltip, UpdateChartWatermark, ChartTooltipXY, ChartTooltipSeries}