import middy from "@middy/core";
import ssm from '@middy/ssm'

const impl = async (event: any, context: any) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
    try {
        const response = {
            statusCode: 200,
            body: JSON.stringify({ message: 'Hello ' + context.configuration }),
        };
        return response;
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

export const handler = middy()
    .use(ssm({
        fetchData: {
            configuration: '/sample-configuration'
        },
        setToContext: true
    }))
    .handler(impl);
