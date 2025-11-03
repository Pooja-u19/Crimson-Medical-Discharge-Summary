// AWS Services Test Script
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();
const bedrock = new AWS.BedrockRuntime();

async function testAWSServices() {
    console.log('🔍 Testing AWS Services Access...\n');

    // Test 1: Lambda Functions
    console.log('1. Testing Lambda Functions...');
    try {
        const functions = await lambda.listFunctions({}).promise();
        const dischargeFunctions = functions.Functions.filter(f => 
            f.FunctionName.includes('discharge-summary')
        );
        console.log(`✅ Found ${dischargeFunctions.length} Lambda functions`);
        dischargeFunctions.forEach(f => {
            console.log(`   - ${f.FunctionName} (${f.Runtime})`);
        });
    } catch (error) {
        console.log('❌ Lambda access error:', error.message);
    }

    // Test 2: DynamoDB Tables
    console.log('\n2. Testing DynamoDB Tables...');
    try {
        const tables = await dynamodb.listTables({}).promise();
        const dischargeTables = tables.TableNames.filter(t => 
            t.includes('discharge-summary')
        );
        console.log(`✅ Found ${dischargeTables.length} DynamoDB tables`);
        
        for (const tableName of dischargeTables) {
            try {
                const tableInfo = await dynamodb.describeTable({ TableName: tableName }).promise();
                console.log(`   - ${tableName}: ${tableInfo.Table.TableStatus}`);
            } catch (err) {
                console.log(`   - ${tableName}: ERROR - ${err.message}`);
            }
        }
    } catch (error) {
        console.log('❌ DynamoDB access error:', error.message);
    }

    // Test 3: S3 Buckets
    console.log('\n3. Testing S3 Buckets...');
    try {
        const buckets = await s3.listBuckets({}).promise();
        const dischargeBuckets = buckets.Buckets.filter(b => 
            b.Name.includes('discharge-summary')
        );
        console.log(`✅ Found ${dischargeBuckets.length} S3 buckets`);
        
        for (const bucket of dischargeBuckets) {
            try {
                await s3.headBucket({ Bucket: bucket.Name }).promise();
                console.log(`   - ${bucket.Name}: Accessible`);
            } catch (err) {
                console.log(`   - ${bucket.Name}: ERROR - ${err.message}`);
            }
        }
    } catch (error) {
        console.log('❌ S3 access error:', error.message);
    }

    // Test 4: Bedrock Model
    console.log('\n4. Testing Bedrock Model Access...');
    try {
        const testPayload = {
            modelId: 'amazon.nova-lite-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                messages: [{ role: 'user', content: [{ text: 'Hello' }] }],
                inferenceConfig: { maxTokens: 10, temperature: 0.1 }
            })
        };
        
        const response = await bedrock.invokeModel(testPayload).promise();
        console.log('✅ Bedrock Nova Lite model accessible');
    } catch (error) {
        console.log('❌ Bedrock access error:', error.message);
        if (error.code === 'AccessDeniedException') {
            console.log('   💡 Tip: Enable Bedrock model access in AWS Console');
        }
    }

    // Test 5: Lambda Environment Variables
    console.log('\n5. Checking Lambda Environment Variables...');
    const functionNames = [
        'discharge-summary-dev-create-request',
        'discharge-summary-dev-get-request',
        'discharge-summary-dev-generate-summary'
    ];

    for (const functionName of functionNames) {
        try {
            const config = await lambda.getFunction({ FunctionName: functionName }).promise();
            const env = config.Configuration.Environment?.Variables || {};
            console.log(`\n   ${functionName}:`);
            console.log(`   - DOCUMENTS_S3_BUCKET: ${env.DOCUMENTS_S3_BUCKET || 'MISSING'}`);
            console.log(`   - REQUESTS_DYNAMODB_TABLE: ${env.REQUESTS_DYNAMODB_TABLE || 'MISSING'}`);
            console.log(`   - DOCUMENTS_DYNAMODB_TABLE: ${env.DOCUMENTS_DYNAMODB_TABLE || 'MISSING'}`);
            console.log(`   - BEDROCK_MODEL_ID: ${env.BEDROCK_MODEL_ID || 'MISSING'}`);
        } catch (error) {
            console.log(`   ${functionName}: ERROR - ${error.message}`);
        }
    }

    console.log('\n🔍 Diagnosis Complete!');
}

// Run tests
testAWSServices().catch(console.error);