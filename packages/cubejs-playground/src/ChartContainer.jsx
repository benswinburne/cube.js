/* global navigator */
import React from 'react';
import {
  CodeOutlined,
  CodeSandboxOutlined,
  CopyOutlined,
  DownOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Modal, notification } from 'antd';
import { Button, Card, SectionRow } from './components';
import { getParameters } from 'codesandbox-import-utils/lib/api/define';
import styled from 'styled-components';
import { Redirect, withRouter } from 'react-router-dom';
import { QueryRenderer } from '@cubejs-client/react';
import sqlFormatter from 'sql-formatter';
import PropTypes from 'prop-types';
import PrismCode from './PrismCode';
import CachePane from './components/CachePane';
import { playgroundAction } from './events';

const StyledCard = styled(Card)`
  .ant-card-head {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
  }

  .ant-card-body {
    max-width: 100%;
    overflow: auto;
  }
`;

export const frameworks = [
  {
    id: 'vanilla',
    title: 'Vanilla JavaScript',
    docsLink: 'https://cube.dev/docs/@cubejs-client-core',
  },
  {
    id: 'react',
    title: 'React',
    supported: true,
    scaffoldingSupported: true,
  },
  {
    id: 'angular',
    title: 'Angular',
    docsLink: 'https://cube.dev/docs/@cubejs-client-ngx',
    scaffoldingSupported: true,
  },
  {
    id: 'vue',
    title: 'Vue.js',
    docsLink: 'https://cube.dev/docs/@cubejs-client-vue',
  },
];

class ChartContainer extends React.Component {
  static getDerivedStateFromProps(props, state) {
    if (state.isChartRendererReady) {
      return {
        ...state,
        dependencies: window.__cubejs.dependencies(props.chartingLibrary),
        codeExample: window.__cubejs.codegen(props.chartingLibrary, {
          query: props.query,
          chartType: props.chartType,
          pivotConfig: props.pivotConfig,
        }),
      };
    }
    return state;
  }

  constructor(props) {
    super(props);
    this.state = {
      showCode: false,
      framework: 'react',
      isChartRendererReady: false,
    };
  }

  async componentDidMount() {
    document.body.addEventListener('cubejsChartReady', () => {
      this.setState({
        isChartRendererReady: true,
      });
    });
  }

  codeSandboxDefinition(codeSandboxSource, dependencies = []) {
    return {
      files: {
        ...(typeof codeSandboxSource === 'string'
          ? {
              'index.js': {
                content: codeSandboxSource,
              },
            }
          : codeSandboxSource),
        'package.json': {
          content: {
            dependencies: {
              'react-dom': 'latest',
              ...dependencies.reduce((memo, d) => ({ ...memo, [d]: 'latest' }), {}),
            },
          },
        },
      },
      template: 'create-react-app',
    };
  }

  render() {
    const {
      codeExample,
      dependencies,
      redirectToDashboard,
      showCode,
      addingToDashboard,
      framework,
      isChartRendererReady,
    } = this.state;
    const {
      resultSet,
      error,
      render,
      dashboardSource,
      hideActions,
      query,
      cubejsApi,
      chartingLibrary,
      setChartLibrary,
      chartLibraries,
      history,
    } = this.props;

    if (redirectToDashboard) {
      return <Redirect to="/dashboard" />;
    }

    const parameters = isChartRendererReady
      ? getParameters(this.codeSandboxDefinition(codeExample, dependencies))
      : null;

    const chartLibrariesMenu = (
      <Menu
        onClick={(e) => {
          playgroundAction('Set Chart Library', { chartingLibrary: e.key });
          setChartLibrary(e.key);
        }}
      >
        {chartLibraries.map((library) => (
          <Menu.Item key={library.value}>{library.title}</Menu.Item>
        ))}
      </Menu>
    );

    const frameworkMenu = (
      <Menu
        onClick={(e) => {
          playgroundAction('Set Framework', { framework: e.key });
          this.setState({ framework: e.key });
        }}
      >
        {frameworks.map((f) => (
          <Menu.Item key={f.id}>{f.title}</Menu.Item>
        ))}
      </Menu>
    );

    const currentLibraryItem = chartLibraries.find(
      (m) => m.value === chartingLibrary
    );
    const frameworkItem = frameworks.find((m) => m.id === framework);
    const extra = (
      <form
        action="https://codesandbox.io/api/v1/sandboxes/define"
        method="POST"
        target="_blank"
      >
        {parameters != null ? (
          <input type="hidden" name="parameters" value={parameters} />
        ) : null}
        <SectionRow>
          <Button.Group>
            <Dropdown overlay={frameworkMenu}>
              <Button size="small">
                {frameworkItem && frameworkItem.title}
                <DownOutlined />
              </Button>
            </Dropdown>
            <Dropdown
              overlay={chartLibrariesMenu}
              disabled={!frameworkItem.supported}
            >
              <Button size="small">
                {currentLibraryItem && currentLibraryItem.title}
                <DownOutlined />
              </Button>
            </Dropdown>
          </Button.Group>
          <Button.Group>
            <Button
              onClick={() => {
                playgroundAction('Show Chart');
                this.setState({
                  showCode: null,
                });
              }}
              size="small"
              type={!showCode ? 'primary' : 'default'}
              disabled={!frameworkItem.supported}
            >
              Chart
            </Button>
            <Button
              onClick={() => {
                playgroundAction('Show Query');
                this.setState({
                  showCode: 'query',
                });
              }}
              icon={<ThunderboltOutlined />}
              size="small"
              type={showCode === 'query' ? 'primary' : 'default'}
              disabled={!frameworkItem.supported}
            >
              JSON Query
            </Button>
            <Button
              onClick={() => {
                playgroundAction('Show Code');
                this.setState({ showCode: 'code' });
              }}
              icon={<CodeOutlined />}
              size="small"
              type={showCode === 'code' ? 'primary' : 'default'}
              disabled={!frameworkItem.supported}
            >
              Code
            </Button>
            <Button
              onClick={() => {
                playgroundAction('Show SQL');
                this.setState({ showCode: 'sql' });
              }}
              icon={<QuestionCircleOutlined />}
              size="small"
              type={showCode === 'sql' ? 'primary' : 'default'}
              disabled={!frameworkItem.supported}
            >
              SQL
            </Button>
            <Button
              onClick={() => {
                playgroundAction('Show Cache');
                this.setState({
                  showCode: 'cache',
                });
              }}
              icon={<SyncOutlined />}
              size="small"
              type={showCode === 'cache' ? 'primary' : 'default'}
              disabled={!frameworkItem.supported}
            >
              Cache
            </Button>
          </Button.Group>
          <Button
            icon={<CodeSandboxOutlined />}
            size="small"
            onClick={() => playgroundAction('Open Code Sandbox')}
            htmlType="submit"
            disabled={!frameworkItem.supported}
          >
            Edit
          </Button>
          {dashboardSource && (
            <Button
              onClick={async () => {
                this.setState({ addingToDashboard: true });
                const canAddChart = await dashboardSource.canAddChart();
                if (typeof canAddChart === 'boolean' && canAddChart) {
                  playgroundAction('Add to Dashboard');
                  await dashboardSource.addChart(codeExample);
                  this.setState({
                    redirectToDashboard: true,
                    addingToDashboard: false,
                  });
                } else if (!canAddChart) {
                  this.setState({ addingToDashboard: false });
                  Modal.error({
                    title:
                      'Your dashboard app does not support adding of static charts',
                    content: 'Please use static dashboard template',
                  });
                } else {
                  this.setState({ addingToDashboard: false });
                  Modal.error({
                    title: 'There is an error loading your dashboard app',
                    content: canAddChart,
                    okText: 'Fix',
                    okCancel: true,
                    onOk() {
                      history.push('/dashboard');
                    },
                  });
                }
              }}
              icon={<PlusOutlined />}
              size="small"
              loading={addingToDashboard}
              disabled={!frameworkItem.supported}
              type="primary"
            >
              {addingToDashboard
                ? 'Preparing dashboard app. It may take a while. Please check console for progress...'
                : 'Add to Dashboard'}
            </Button>
          )}
        </SectionRow>
      </form>
    );

    const queryText = JSON.stringify(query, null, 2);

    const renderChart = () => {
      if (!frameworkItem?.supported) {
        return (
          <h2 style={{ padding: 24, textAlign: 'center' }}>
            We do not support&nbsp;
            {frameworkItem.title}
            &nbsp;code generation here yet.
            <br />
            Please refer to&nbsp;
            <a
              href={frameworkItem.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                playgroundAction('Unsupported Framework Docs', { framework })
              }
            >
              {frameworkItem.title}
              &nbsp;docs
            </a>
            &nbsp;to see on how to use it with Cube.js.
          </h2>
        );
      } else if (showCode === 'code') {
        return <PrismCode code={codeExample} />;
      } else if (showCode === 'query') {
        return <PrismCode code={queryText} />;
      } else if (showCode === 'sql') {
        return (
          <QueryRenderer
            loadSql="only"
            query={query}
            cubejsApi={cubejsApi}
            render={({ sqlQuery }) => {
              const [query] = Array.isArray(sqlQuery) ? sqlQuery : [sqlQuery];
              // in the case of a compareDateRange query the SQL will be the same
              return (
                <PrismCode code={query && sqlFormatter.format(query.sql())} />
              );
            }}
          />
        );
      } else if (showCode === 'cache') {
        return <CachePane query={query} cubejsApi={cubejsApi} />;
      }
      return render({ framework, error });
    };

    let title;

    const copyCodeToClipboard = async () => {
      if (!navigator.clipboard) {
        notification.error({
          message: "Your browser doesn't support copy to clipboard",
        });
      }
      try {
        await navigator.clipboard.writeText(
          showCode === 'query' ? queryText : codeExample
        );
        notification.success({
          message: 'Copied to clipboard',
        });
      } catch (e) {
        notification.error({
          message: "Can't copy to clipboard",
          description: e,
        });
      }
    };

    if (showCode === 'code') {
      title = (
        <SectionRow>
          <div>Query</div>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => {
              copyCodeToClipboard();
              playgroundAction('Copy Code to Clipboard');
            }}
            type="primary"
          >
            Copy to Clipboard
          </Button>
        </SectionRow>
      );
    } else if (showCode === 'query') {
      title = (
        <SectionRow>
          <div>Query</div>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => {
              copyCodeToClipboard();
              playgroundAction('Copy Query to Clipboard');
            }}
            type="primary"
          >
            Copy to Clipboard
          </Button>
        </SectionRow>
      );
    } else if (showCode === 'sql') {
      title = 'SQL';
    } else {
      title = 'Chart';
    }

    return hideActions ? (
      render({ resultSet, error })
    ) : (
      <StyledCard title={title} style={{ minHeight: 420 }} extra={extra}>
        {renderChart()}
      </StyledCard>
    );
  }
}

ChartContainer.propTypes = {
  resultSet: PropTypes.object,
  error: PropTypes.object,
  render: PropTypes.func.isRequired,
  codeSandboxSource: PropTypes.string,
  dependencies: PropTypes.object.isRequired,
  dashboardSource: PropTypes.object,
  hideActions: PropTypes.array,
  query: PropTypes.object,
  cubejsApi: PropTypes.object,
  history: PropTypes.object.isRequired,
  chartingLibrary: PropTypes.string.isRequired,
  setChartLibrary: PropTypes.func.isRequired,
  chartLibraries: PropTypes.array.isRequired,
};

ChartContainer.defaultProps = {
  query: {},
  cubejsApi: null,
  hideActions: null,
  dashboardSource: null,
  codeSandboxSource: null,
  error: null,
  resultSet: null,
};

export default withRouter(ChartContainer);
