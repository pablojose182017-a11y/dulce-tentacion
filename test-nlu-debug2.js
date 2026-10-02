const fs = require('fs');

global.window = {};
global.document = {
    getElementById: () => ({ value: '', innerHTML: '', style: {}, appendChild: () => {}, remove: () => {} }),
    createElement: () => ({ style: {} })
};
global.localStorage = { 
    data: {}, 
    setItem(k,v){this.data[k]=v;}, 
    getItem(k){return this.data[k]||null;}, 
    removeItem(k){delete this.data[k];} 
};
global.prompt = () => "test_key";
global.currentUser = { email: "test" };

global.fetch = async () => ({ ok: true, json: async () => ({}) });

const deps = [
    'ai-core/ai-store.js',
    'ai-core/ai-memory.js',
    'ai-core/ai-knowledge.js',
    'ai-core/ai-security.js',
    'ai-core/ai-identity.js',
    'ai-core/ai-context.js',
    'ai-core/ai-provider.js',
    'ai-core/ai-reasoning.js',
    'ai-core/ai-personality.js',
    'ai-core/ai-offline-resolver.js',
    'ai-core/ai-web-fetcher.js',
    'ai-core/ai-ingestion.js',
    'ai-core/ai-investigation.js',
    'ai-core/ai-research-engine.js',
    'ai-core/ai-understanding.js',
    'ai-core/ai-chat-bridge.js'
];

deps.forEach(file => {
    try {
        const code = fs.readFileSync('./' + file, 'utf8');
        eval(code);
    } catch(e){}
});

async function debug() {
    window.AI_CORE.chatBridgeInstance = new window.AI_CORE.ChatBridge();
    
    await window.AI_CORE.chatBridgeInstance.receiveMessage("investiga los huevos", global.currentUser, null);
    
    const history = window.AI_CORE.chatBridgeInstance.memoryManager.getShortTermMemory();
    console.log("HISTORY:", JSON.stringify(history, null, 2));
    
    const interp = window.AI_CORE.chatBridgeInstance.understandingEngine.analyze("eso", history);
    console.log("eso intent:", interp.intent);
}
debug();
