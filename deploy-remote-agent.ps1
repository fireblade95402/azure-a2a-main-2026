# Deploy Remote Agent to Azure Container Apps
# Usage: ./deploy-remote-agent.ps1 -AgentName azurefoundry_fraud -Port 9004

param(
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    
    [Parameter(Mandatory=$true)]
    [int]$Port,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-a2a-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$AcrName = "acra2aprod",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "env-a2a-prod"
)

$AgentPath = "remote_agents/$AgentName"

Write-Host "🤖 Deploying Remote Agent: $AgentName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if agent directory exists
if (!(Test-Path $AgentPath)) {
    Write-Host "❌ Agent not found at: $AgentPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available agents:" -ForegroundColor Yellow
    Get-ChildItem -Path "remote_agents" -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
    exit 1
}

# Check if Dockerfile exists
if (!(Test-Path "$AgentPath/Dockerfile")) {
    Write-Host "❌ Dockerfile not found in $AgentPath" -ForegroundColor Red
    exit 1
}

# Login to ACR
Write-Host "🔐 Logging in to ACR..." -ForegroundColor Cyan
az acr login --name $AcrName

# Build the image
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
$imageName = "$AcrName.azurecr.io/a2a-$AgentName`:latest"
docker build -f "$AgentPath/Dockerfile" -t $imageName $AgentPath

# Push to ACR
Write-Host "📤 Pushing image to ACR..." -ForegroundColor Cyan
docker push $imageName

# Deploy to Container Apps
Write-Host "🚀 Deploying to Azure Container Apps..." -ForegroundColor Cyan

# Get backend FQDN for registration
$backendFqdn = az containerapp show `
    --name backend `
    --resource-group $ResourceGroup `
    --query properties.configuration.ingress.fqdn -o tsv 2>$null

if (!$backendFqdn) {
    Write-Host "⚠️  Backend not found. Agent will run but may not auto-register." -ForegroundColor Yellow
    $backendFqdn = "localhost"
}

az containerapp create `
    --name $AgentName.ToLower().Replace("_", "-") `
    --resource-group $ResourceGroup `
    --environment $Environment `
    --image $imageName `
    --target-port $Port `
    --ingress external `
    --min-replicas 1 `
    --max-replicas 2 `
    --cpu 0.5 `
    --memory 1.0Gi `
    --registry-server "$AcrName.azurecr.io" `
    --env-vars `
        "A2A_PORT=$Port" `
        "A2A_HOST=0.0.0.0" `
        "HOST_AGENT_URL=https://$backendFqdn"

$agentFqdn = az containerapp show `
    --name $AgentName.ToLower().Replace("_", "-") `
    --resource-group $ResourceGroup `
    --query properties.configuration.ingress.fqdn -o tsv

Write-Host ""
Write-Host "✅ Agent deployed successfully!" -ForegroundColor Green
Write-Host "   URL: https://$agentFqdn" -ForegroundColor Cyan
Write-Host "   Port: $Port" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "   az containerapp logs show --name $($AgentName.ToLower().Replace('_', '-')) --resource-group $ResourceGroup --follow" -ForegroundColor White

