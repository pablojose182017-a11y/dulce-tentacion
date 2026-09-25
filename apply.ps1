$content = Get-Content -Path "script.js" -Raw
$target = "        return ``
            <div style=`"background: `${isUnread ? '#fff5f7' : '#fafafa'}; border-left: 3px solid `${isUnread ? '#e91e63' : '#cbd5e1'}; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;`">
                <div style=`"display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;`">
                    <div style=`"font-weight: 700; color: #1e293b;`">`${item.title || '🔔 Notificación'}</div>
                    <span style=`"font-size: 0.68rem; color: #94a3b8; white-space: nowrap;`">`${timeDisplay}</span>
                </div>
                <div style=`"color: #475569; font-size: 0.78rem; margin-top: 3px; word-break: break-word;`">`${item.message || ''}</div>
            </div>
        ``;
    }).join('');
};

window.clearAdminNotifs = function() {"

$replacement = "        const payloadStr = encodeURIComponent(JSON.stringify(item));
        return ``
            <div onclick=`"window.handleNotifClick(event, '`${payloadStr}')`" style=`"cursor: pointer; background: `${isUnread ? '#fff5f7' : '#fafafa'}; border-left: 3px solid `${isUnread ? '#e91e63' : '#cbd5e1'}; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;`">
                <div style=`"display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;`">
                    <div style=`"font-weight: 700; color: #1e293b;`">`${item.title || '🔔 Notificación'}</div>
                    <span style=`"font-size: 0.68rem; color: #94a3b8; white-space: nowrap;`">`${timeDisplay}</span>
                </div>
                <div style=`"color: #475569; font-size: 0.78rem; margin-top: 3px; word-break: break-word;`">`${item.message || ''}</div>
            </div>
        ``;
    }).join('');
};

window.handleNotifClick = function(event, payloadStr) {
    if (event) event.stopPropagation();
    try {
        const item = JSON.parse(decodeURIComponent(payloadStr));
        
        // 1. Cerrar Dropdown
        const dd = document.getElementById('adminNotifDropdown');
        if (dd) dd.style.display = 'none';

        // 2. Enrutar
        const isOrder = item.orderId || (item.title && item.title.toLowerCase().includes('pedido'));
        const isVip = item.type === 'solicitud_vip' || (item.title && item.title.toLowerCase().includes('vip'));

        if (typeof showSection === 'function') showSection('admin-dashboard');

        if (isOrder) {
            if (typeof window.cambiarPestanaAdmin === 'function') window.cambiarPestanaAdmin('pedidos');
            
            // Hacer scroll a la tarjeta del pedido
            const oId = item.orderId || (item.title.match(/#([A-Z0-9-]+)/) ? item.title.match(/#([A-Z0-9-]+)/)[1] : null);
            if (oId) {
                setTimeout(() => {
                    let orderCard = document.querySelector(`"[data-order-id=`"${oId}`"]`");
                    if (!orderCard) {
                        const allCards = Array.from(document.querySelectorAll('.pedido-card'));
                        orderCard = allCards.find(el => el.innerHTML.includes(oId));
                    }
                    if (orderCard) {
                        orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const oldBg = orderCard.style.background || '';
                        orderCard.style.background = '#fef08a';
                        setTimeout(() => orderCard.style.background = oldBg, 1500);
                    }
                }, 300);
            }
        } else if (isVip) {
            if (typeof window.cambiarPestanaAdmin === 'function') window.cambiarPestanaAdmin('usuarios');
            
            // Filtrado automático en #adminUserSearch
            const emailMatch = item.message ? item.message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/) : null;
            if (emailMatch) {
                setTimeout(() => {
                    const searchInput = document.getElementById('adminUserSearch');
                    if (searchInput) {
                        searchInput.value = emailMatch[1];
                        searchInput.dispatchEvent(new Event('input'));
                    }
                }, 300);
            }
        }
    } catch(e) {
        console.error(`"Error al procesar click de notificación:`", e);
    }
};

window.clearAdminNotifs = function() {"

$targetNormalized = $target -replace "`r`n", "`n"
$contentNormalized = $content -replace "`r`n", "`n"
$replacementNormalized = $replacement -replace "`r`n", "`n"

if ($contentNormalized.Contains($targetNormalized)) {
    $contentNormalized = $contentNormalized.Replace($targetNormalized, $replacementNormalized)
    Set-Content -Path "script.js" -Value $contentNormalized -NoNewline
    Write-Host "Success"
} else {
    Write-Host "Not found"
}
