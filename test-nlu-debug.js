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
    const interp1 = window.AI_CORE.chatBridgeInstance.understandingEngine.analyze("busca informacion", []);
    console.log("busca informacion:", interp1.intent, interp1.isClarificationNeeded);
    
    await window.AI_CORE.chatBridgeInstance.receiveMessage("busca informacion", global.currentUser, null);
    
    const history = window.AI_CORE.chatBridgeInstance.memoryManager.getShortTermMemory();
    console.log("HISTORY:", JSON.stringify(history, null, 2));
    
    const interp2 = window.AI_CORE.chatBridgeInstance.understandingEngine.analyze("la calidad del pan", history);
    console.log("la calidad del pan:", interp2.intent);
    
    await window.AI_CORE.chatBridgeInstance.receiveMessage("investiga los huevos", global.currentUser, null);
    const h2 = window.AI_CORE.chatBridgeInstance.memoryManager.getShortTermMemory();
    const interp3 = window.AI_CORE.chatBridgeInstance.understandingEngine.analyze("eso", h2);
    console.log("eso:", interp3.intent);
}
debug();
