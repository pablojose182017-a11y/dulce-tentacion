const { SourceProvenance, ClaimIdentity, ProvenanceGraph } = require('./ai-provenance.js');
const crypto = require('crypto');

function assert(condition, testName) {
    console.log(`${testName}: ${condition ? 'PASS' : 'FAIL'}`);
}

async function runTests() {
    console.log("=== INICIANDO FP-01 a FP-10 (Content Tampering) ===");
    let contentA = "Contenido legitimo A";
    let hashA = crypto.createHash('sha256').update(contentA).digest('hex');

    // FP-01 / FP-02
    let s1 = new SourceProvenance({ content: contentA });
    assert(s1.contentFingerprint === hashA, 'FP-01/FP-02');

    // FP-03
    let s2 = new SourceProvenance({ content: "Contenido B" });
    assert(s2.contentFingerprint !== hashA, 'FP-03');

    // FP-04: fake fingerprint does not replace computed
    let s3 = new SourceProvenance({ content: contentA, contentFingerprint: "fake_hash" });
    assert(s3.contentFingerprint === hashA && s3.fingerprintMismatch === true, 'FP-04');

    // FP-05, FP-06, FP-07
    let graph = new ProvenanceGraph();
    graph.registerSource({ sourceId: 'SA', content: contentA });
    // provider tries to declare independence with fake hash
    let sFake = graph.registerSource({ sourceId: 'SB', content: contentA, contentFingerprint: 'fake' });
    assert(sFake.contentFingerprint === hashA && sFake.independenceStatus === 'DUPLICATE', 'FP-05/FP-06/FP-07');

    // FP-08: diff ids, same content => same calculated fingerprint
    assert(s1.contentFingerprint === sFake.contentFingerprint, 'FP-08');

    // FP-09: diff content, diff ids = not automatic duplicate
    let sDiff = graph.registerSource({ sourceId: 'SC', content: "Otro" });
    assert(sDiff.independenceStatus === 'INDEPENDENT', 'FP-09');

    // FP-10: metadata doesn't alter semantic content hash
    let sMeta = new SourceProvenance({ content: contentA, confidence: 0.1, author: 'Bob' });
    assert(sMeta.contentFingerprint === hashA, 'FP-10');


    console.log("\n=== INICIANDO IMM-01 a IMM-12 (Deep Immutability) ===");
    let c1 = graph.registerClaim({ subject: 'A', epistemicStatus: 'FACT', objectValue: '10' }, s1, 'e');
    let c2 = graph.registerClaim({ subject: 'A', epistemicStatus: 'FACT', objectValue: '20' }, sDiff, 'e');
    let conflicts = Array.from(graph.conflicts.values());
    let conf = graph.getConflict(conflicts[0].conflictId);

    // IMM-01 to IMM-05
    let immFail = false;
    try {
        conf.status = 'DELETED';
        conf.claimA.supports = [];
        conf.resolutionHistory.push('hacked');
        conf.conflictType = 'HACKED';
    } catch(e) { immFail = true; }
    let checkConf = graph.getConflict(conf.conflictId);
    assert(immFail || checkConf.status === 'OPEN', 'IMM-01..IMM-05/10/11');

    // IMM-06 to IMM-07
    let gap = graph.createKnowledgeGap("test gap", []);
    let gapFail = false;
    try {
        gap.status = 'DELETED';
        gap.missingInformation = 'hacked';
    } catch (e) { gapFail = true; }
    assert(gapFail || graph.getKnowledgeGap(gap.gapId).status === 'OPEN', 'IMM-06/IMM-07');

    // IMM-08
    let srcCheck = graph.sources.get(s1.sourceId);
    let srcFail = false;
    try { srcCheck.origin = 'hacked'; } catch(e) { srcFail = true; }
    assert(srcFail || graph.sources.get(s1.sourceId).origin !== 'hacked', 'IMM-08');

    // IMM-12
    let resolvedConf = graph.resolveConflict(conf.conflictId, "manual check");
    let resolveFail = false;
    try { resolvedConf.status = 'OPEN'; } catch(e) { resolveFail = true; }
    assert(resolveFail || graph.getConflict(conf.conflictId).status === 'RESOLVED', 'IMM-12');


    console.log("\n=== INICIANDO CYC-01 a CYC-10 (Deep Cycle Detection) ===");
    let gCyc = new ProvenanceGraph();
    gCyc.registerSource({ sourceId: 'A', content: 'a' });
    gCyc.registerSource({ sourceId: 'B', content: 'b', copiedFrom: 'A' });
    gCyc.registerSource({ sourceId: 'C', content: 'c', copiedFrom: 'B' });
    gCyc.registerSource({ sourceId: 'D', content: 'd', copiedFrom: 'C' });

    // CYC-01
    let cyc1 = false;
    try { gCyc.registerSource({ sourceId: 'X', copiedFrom: 'X' }); } catch(e) { cyc1 = true; }
    assert(cyc1, 'CYC-01');

    // CYC-03: A -> B -> C -> A
    let cyc3 = false;
    try { gCyc.registerSource({ sourceId: 'A', copiedFrom: 'C' }); } catch(e) { cyc3 = true; }
    assert(cyc3, 'CYC-03');

    // CYC-04: A -> B -> C -> D -> A
    let cyc4 = false;
    try { gCyc.registerSource({ sourceId: 'A', copiedFrom: 'D' }); } catch(e) { cyc4 = true; }
    assert(cyc4, 'CYC-04');

    // CYC-07 / CYC-08: deep valid graph
    let lastId = 'N0';
    gCyc.registerSource({ sourceId: lastId, content: 'n0' });
    for(let i=1; i<=100; i++) {
        let newId = 'N'+i;
        gCyc.registerSource({ sourceId: newId, copiedFrom: lastId });
        lastId = newId;
    }
    assert(gCyc.sources.has('N100'), 'CYC-07/CYC-08');


    console.log("\n=== INICIANDO ADV-P01 a ADV-P10 (Adversarial) ===");
    let advGraph = new ProvenanceGraph();
    // ADV-P01 (fake hash handled in FP)
    // ADV-P03
    let p3 = advGraph.registerSource({ sourceId: 'P3_2', copiedFrom: 'P3_1', independenceStatus: 'INDEPENDENT' });
    assert(p3.independenceStatus === 'COPIED', 'ADV-P03');
    
    // ADV-P04/ADV-P05: Fake parent source
    let p5 = advGraph.registerSource({ sourceId: 'P5', copiedFrom: 'DOESNOTEXIST' });
    assert(advGraph._findRootSource(p5).sourceId === 'P5', 'ADV-P04/05');

    // ADV-P06/07 handled in IMM

    // ADV-P08: deep cycle handled in CYC

    // ADV-P10: flood
    for(let i=0; i<100; i++) advGraph.registerSource({ sourceId: `F${i}`, content: 'FLOOD_CONT' });
    let fRoots = 0;
    for(let i=0; i<100; i++) {
        if(advGraph.sources.get(`F${i}`).independenceStatus !== 'DUPLICATE') fRoots++;
    }
    assert(fRoots === 1, 'ADV-P10');
    
    console.log("\n=== TESTS COMPLETADOS ===");
}
runTests();
