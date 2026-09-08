const WEBHOOK =
"http://localhost:5678/webhook/phishing-analysis";

const analyzeBtn =
document.getElementById("analyzeBtn");

analyzeBtn.addEventListener(
    "click",
    analyzeEmail
);

async function analyzeEmail(){

    document
    .getElementById("loading")
    .classList.remove("hidden");

    const [tab] =
    await chrome.tabs.query({
        active:true,
        currentWindow:true
    });

    const emailData =
    await chrome.tabs.sendMessage(
        tab.id,
        {
            action:"extractEmail"
        }
    );

    const response =
    await fetch(WEBHOOK,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(emailData)
    });

    const result =
    await response.json();

    console.log(
        "WEBHOOK RESPONSE:",
        result
    );

    showResult(result);

    chrome.storage.local.set({
        latestReport:result
    });
}

function showResult(result){

    document
    .getElementById("loading")
    .classList.add("hidden");

    document
    .getElementById("result")
    .classList.remove("hidden");

    document
    .getElementById("riskLevel")
    .textContent =
    result.verdict;

    document
    .getElementById("riskScore")
    .textContent =
    result.risk_score + "/100";

    document
    .getElementById("confidence")
    .textContent =
    "Confidence: " +
    (result.confidence || 90) +
    "%";

    document
    .getElementById("summary")
    .textContent =
    result.summary || "No Summary Available";

    document
    .getElementById("recommendation")
    .textContent =
    result.recommendation || "";

    const findings =
    document.getElementById(
        "findingsList"
    );

    findings.innerHTML = "";

    (result.findings || [])
    .forEach(item => {

        const li =
        document.createElement("li");

        li.textContent = item;

        findings.appendChild(li);

    });

    const riskCard =
    document.getElementById(
        "riskCard"
    );

    if(result.verdict==="SAFE"){
        riskCard.style.background =
        "#d1fae5";
    }
    else if(
        result.verdict==="SUSPICIOUS"
    ){
        riskCard.style.background =
        "#fef3c7";
    }
    else{
        riskCard.style.background =
        "#fee2e2";
    }
}

document
.getElementById("viewReportBtn")
?.addEventListener(
"click",
()=>{
    chrome.tabs.create({
        url:"report.html"
    });
});

document
.getElementById("downloadReportBtn")
?.addEventListener(
"click",
async ()=>{

    const data =
    await chrome.storage.local.get(
        "latestReport"
    );

    const report =
    data.latestReport.report || "";

    const blob =
    new Blob(
        [report],
        {
            type:"text/plain"
        }
    );

    const url =
    URL.createObjectURL(blob);

    const a =
    document.createElement("a");

    a.href=url;

    a.download=
    "PhishGuard_Report.txt";

    a.click();
});
