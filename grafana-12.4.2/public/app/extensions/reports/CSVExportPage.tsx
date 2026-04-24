import { saveAs } from 'file-saver';
import { useState, useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useParams } from 'react-router-dom-v5-compat';

import { applyFieldOverrides, PanelData, dateTimeFormat, toCSV, LoadingState, FieldConfigSource } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { SoloPanel } from 'app/features/dashboard/containers/SoloPanelPage';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { StoreState } from 'app/types/store';

import { CSVEncoding } from '../types';

export interface DashboardPageRouteParams {
  uid?: string;
  type?: string;
  slug?: string;
}

export interface OwnProps
  extends GrafanaRouteComponentProps<
    DashboardPageRouteParams,
    { panelId?: string; timezone?: string; csvEncoding?: CSVEncoding }
  > {
  dashboard: DashboardModel | null;
}

export interface State {
  panel: PanelModel | null;
  notFound: boolean;
}

const mapStateToProps = (state: StoreState) => ({
  dashboard: state.dashboard.getModel(),
});

const mapDispatchToProps = { initDashboard };

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = ConnectedProps<typeof connector> & OwnProps;

const CSVExportPage = ({ initDashboard, route, queryParams, dashboard }: Props) => {
  const { keybindings } = useGrafana();
  const [panel, setPanel] = useState<PanelModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { slug, uid, type } = useParams();

  useEffect(() => {
    initDashboard({
      urlSlug: slug,
      urlUid: uid,
      urlType: type,
      routeName: route.routeName,
      fixUrl: false,
      keybindingSrv: keybindings,
    });
  }, [slug, uid, type, route.routeName, keybindings, initDashboard]);

  const getPanelId = () => {
    return parseInt(queryParams.panelId ?? '0', 10);
  };

  useEffect(() => {
    if (dashboard) {
      const onDataUpdate = (panelData: PanelData) => {
        // We don't want to download any partial data, so Streaming is not a valid state for us.
        // As we don't have any good way to communicate errors besides timing out, Error will also just end up not doing
        // anything...
        // TODO: Should we make errors return an error as CSV?
        if (!panelData || panelData.state !== LoadingState.Done) {
          return;
        }

        const data = panelData.series;
        const timeZone = queryParams.timezone || dashboard?.timezone;
        let emptyFieldConfigSource: FieldConfigSource = { defaults: {}, overrides: [] };

        const dataFrames = applyFieldOverrides({
          data,
          theme: config.theme2,
          fieldConfig: panel?.fieldConfig || emptyFieldConfigSource,
          replaceVariables: (value: string) => value,
          timeZone: timeZone,
        });

        let blob;

        const csvEncoding = queryParams?.csvEncoding || null;
        if (!csvEncoding || csvEncoding === 'utf-8-bom') {
          // Keep legacy encoding support
          const dataFrameCsv = toCSV([dataFrames[0]], {});
          blob = new Blob([String.fromCharCode(0xfeff), dataFrameCsv], { type: 'text/csv;charset=utf-8' });
        } else {
          // Support same options as found in public/app/features/inspector/utils/download.ts @ downloadDataFrameAsCsv
          if (csvEncoding === 'utf-16le') {
            const dataFrameCsv = toCSV([dataFrames[0]], { useExcelHeader: false, delimiter: '\t' });
            const utf16le = new Uint16Array(Array.from('\ufeff' + dataFrameCsv).map((char) => char.charCodeAt(0)));
            blob = new Blob([utf16le], { type: 'text/csv;charset=utf-16le' });
          } else {
            const dataFrameCsv = toCSV([dataFrames[0]], {});
            blob = new Blob([dataFrameCsv], { type: 'text/csv;charset=utf-8' });
          }
        }

        const fileName = `${panel?.getDisplayTitle()}-data-${dateTimeFormat(new Date())}.csv`;
        saveAs(blob, fileName);
      };
      const panel = dashboard.getPanelByUrlId(queryParams.panelId!);

      if (!panel) {
        setNotFound(true);
        return;
      }

      setPanel(panel);

      panel
        .getQueryRunner()
        .getData({ withTransforms: true, withFieldConfig: true })
        .subscribe({
          next: (data) => onDataUpdate(data),
        });
    }
  }, [dashboard, queryParams.panelId, queryParams.timezone, queryParams.csvEncoding]);

  return (
    <SoloPanel
      dashboard={dashboard}
      notFound={notFound}
      panel={panel}
      panelId={getPanelId()}
      timezone={queryParams.timezone}
    />
  );
};

export default connector(CSVExportPage);
