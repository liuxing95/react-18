import {
  getPackageJSON,
  resolvePkgPath,
  getBaseRollupPlugins
} from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const {
  name,
  module
} = getPackageJSON('react-dom');
// react-dom包的路径
const pkgPath = resolvePkgPath(name);
// react-dom产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react-dom
  {
    input: `${pkgPath}/${module}`,
    // 注意区分peerDependencies、dependencies、以及external参数
    // peerDependencies一定属于external，因为它的代码不会打入React-DOM
    // dependencies中：
    //  "react-reconciler": "workspace:*" 不属于external，因为他的代码需要打入React-DOM
    //  "scheduler": "..." 属于external，因为他的代码不需要打入React-DOM
    external: [...Object.keys(peerDependencies), 'scheduler'],
    output: [{
        file: `${pkgDistPath}/index.js`,
        name: 'index.js',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: 'client.js',
        format: 'umd'
      }
    ],
    plugins: [
      ...getBaseRollupPlugins(),
      // webpack resolve alias
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({
          name,
          description,
          version
        }) => ({
          name,
          description,
          version,
          peerDependencies: {
            react: version
          },
          main: 'index.js'
        })
      })
    ]
  }
];