import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const ssm = new StringParameter(this, 'SampleParameter', {
      parameterName: '/sample-configuration',
      stringValue: 'test',
    });

    const fn = new NodejsFunction(this, `mini-${id}`, {
      environment: {
        STACK: id,
        NODE_OPTIONS: '--enable-source-maps',
      },
      runtime: Runtime.NODEJS_18_X,
      memorySize: 512,
      handler: 'handler',
      timeout: Duration.minutes(1),
      entry: path.join(__dirname, './lambda/index.ts'),
      tracing: Tracing.ACTIVE,
      // insightsVersion: LambdaInsightsVersion.VERSION_1_0_229_0,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });
    ssm.grantRead(fn);

    const api = new apigateway.RestApi(this, `mini-api-${id}`, {
      restApiName: `mini-${id}`,
      deployOptions: {
        stageName: 'staging', // Specify your desired stage name
        tracingEnabled: true, // Optionally enable AWS X-Ray tracing

      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    const deviceIntegration = new apigateway.LambdaIntegration(fn);

    const deviceResource = api.root.addResource('configs');

    deviceResource.addMethod('GET', deviceIntegration);

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: '',
  region: 'ap-southeast-2',
};

const app = new App();

new MyStack(app, 'ssm-recreate-dev', { env: devEnv });
// new MyStack(app, 'ssm-recreate-prod', { env: prodEnv });

app.synth();