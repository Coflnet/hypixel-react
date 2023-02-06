/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import api from '../../../api/ApiHelper';
import graphConfig from './PriceGraphConfig';
import {
  DateRange,
  DEFAULT_DATE_RANGE,
  ItemPriceRange,
} from '../../ItemPriceRange/ItemPriceRange';
import { getLoadingElement } from '../../../utils/LoadingUtils';
import { numberWithThousandsSeperators } from '../../../utils/Formatter';
import ShareButton from '../../ShareButton/ShareButton';
import ItemFilter, { getPrefillFilter } from '../../ItemFilter/ItemFilter';
import SubscribeButton from '../../SubscribeButton/SubscribeButton';
import RecentAuctions from '../../RecentAuctions/RecentAuctions';
import ActiveAuctions from '../../ActiveAuctions/ActiveAuctions';
import styles from './AuctionHousePriceGraph.module.css';
import ReactECharts from 'echarts-for-react';
import { AUCTION_GRAPH_LEGEND_SELECTION } from '../../../utils/SettingsUtils';

interface Props {
  item: Item;
}

let currentLoadingString;

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function AuctionHousePriceGraph(props: Props) {
  let [fetchspan, setFetchspan] = useState(DEFAULT_DATE_RANGE);
  let [isLoading, setIsLoading] = useState(false);
  let [noDataFound, setNoDataFound] = useState(false);
  let [avgPrice, setAvgPrice] = useState(0);
  let [filters, setFilters] = useState([] as FilterOptions[]);
  let [itemFilter, setItemFilter] = useState<ItemFilter>();
  let [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true);
  let [chartOptions, setChartOptions] = useState(graphConfig);

  let fetchspanRef = useRef(fetchspan);
  fetchspanRef.current = fetchspan;

  useEffect(() => {
    mounted = true;

    setSelectedLegendOptionsFromLocalStorage();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadFilters().then((filters) => {
      fetchspan = DEFAULT_DATE_RANGE;
      setFetchspan(DEFAULT_DATE_RANGE);
      if (props.item) {
        updateChart(fetchspan, getPrefillFilter(filters));
      }
      setFilters(filters);
    });
  }, [props.item.tag]);

  let updateChart = (fetchspan: DateRange, itemFilter?: ItemFilter) => {
    // active auction is selected
    // no need to get new price data
    if (fetchspan === DateRange.ACTIVE) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    chartOptions.xAxis[0].data = [];
    chartOptions.series[0].data = [];
    chartOptions.series[1].data = [];
    chartOptions.series[2].data = [];
    chartOptions.series[3].data = [];

    currentLoadingString = JSON.stringify({
      tag: props.item.tag,
      fetchspan,
      itemFilter,
    });

    api
      .getItemPrices(
        props.item.tag,
        fetchspan as globalThis.DateRange,
        itemFilter
      )
      .then((prices) => {
        if (
          !mounted ||
          currentLoadingString !==
            JSON.stringify({
              tag: props.item.tag,
              fetchspan,
              itemFilter,
            })
        ) {
          return;
        }

        chartOptions.xAxis[0].data = prices.map((item) => item.time.getTime());

        let priceSum = 0;

        prices.forEach((item) => {
          priceSum += item.avg;
          chartOptions.series[0].data.push(item.avg.toFixed(2));
          chartOptions.series[1].data.push(item.min.toFixed(2));
          chartOptions.series[2].data.push(item.max.toFixed(2));
          chartOptions.series[3].data.push(item.volume.toFixed(2));
        });

        setAvgPrice(Math.round(priceSum / prices.length));
        setNoDataFound(prices.length === 0);
        setIsLoading(false);
        setChartOptions(chartOptions);
      })
      .catch(() => {
        setIsLoading(false);
        setNoDataFound(true);
        setAvgPrice(0);
      });
  };

  let onRangeChange = (timespan: DateRange) => {
    setFetchspan(timespan);
    if (timespan !== DateRange.ACTIVE) {
      updateChart(timespan, itemFilter);
    }
  };

  let onFilterChange = (filter: ItemFilter) => {
    setItemFilter(filter);
    setDefaultRangeSwitch(!defaultRangeSwitch);
    if (fetchspanRef.current !== DateRange.ACTIVE) {
      updateChart(fetchspanRef.current, filter);
    }
  };

  function loadFilters() {
    return api.getFilters(props.item.tag);
  }

  function setSelectedLegendOptionsFromLocalStorage() {
    let legendSelected = localStorage.getItem(AUCTION_GRAPH_LEGEND_SELECTION);
    chartOptions.legend.selected = legendSelected
      ? JSON.parse(legendSelected)
      : chartOptions.legend.selected;
    setChartOptions(chartOptions);
  }

  function onChartsEvents(): Record<string, Function> {
    return {
      legendselectchanged: (e) => {
        localStorage.setItem(
          AUCTION_GRAPH_LEGEND_SELECTION,
          JSON.stringify(e.selected)
        );
      },
    };
  }

  let graphOverlayElement = isLoading ? (
    <div className={styles.graphOverlay}>{getLoadingElement()}</div>
  ) : noDataFound && !isLoading ? (
    <div className={styles.graphOverlay}>
      <div style={{ textAlign: 'center' }}>
        <p>No data found</p>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <ItemFilter filters={filters} onFilterChange={onFilterChange} />
      <ItemPriceRange
        setToDefaultRangeSwitch={defaultRangeSwitch}
        onRangeChange={onRangeChange}
        disableAllTime={itemFilter && JSON.stringify(itemFilter) !== '{}'}
        item={props.item}
        dateRangesToDisplay={[
          DateRange.ACTIVE,
          DateRange.DAY,
          DateRange.WEEK,
          DateRange.MONTH,
          DateRange.ALL,
        ]}
      />

      <div style={fetchspan === DateRange.ACTIVE ? { display: 'none' } : {}}>
        <div className={styles.chartWrapper}>
          {!isLoading && !noDataFound ? (
            <ReactECharts
              option={chartOptions}
              className={styles.chart}
              onEvents={onChartsEvents()}
            />
          ) : (
            graphOverlayElement
          )}
        </div>
        <div className={styles.additionalInfos}>
          <span className={styles.avgPrice}>
            <b>Avg Price:</b>{' '}
            {isLoading
              ? '-'
              : numberWithThousandsSeperators(avgPrice) + ' Coins'}
          </span>
          <div
            style={{ float: 'left' }}
            className={styles.additionalInfosButton}
          >
            <SubscribeButton type='item' topic={props.item.tag} />
          </div>
          <div style={{ float: 'right' }}>
            <ShareButton
              title={'Prices for ' + props.item.name}
              text='See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock'
            />
          </div>
        </div>
        <hr />
      </div>
      {fetchspan === DateRange.ACTIVE ? (
        <ActiveAuctions item={props.item} filter={itemFilter} />
      ) : (
        <RecentAuctions item={props.item} itemFilter={itemFilter} />
      )}
    </div>
  );
}

export default AuctionHousePriceGraph;
