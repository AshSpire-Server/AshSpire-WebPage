const githubFolder = "https://api.github.com/repos/AshSpire-Server/AshSpire-Main/contents/versions";
const latestVersionEl = document.getElementById("version-list");
const olderVersionListEl = document.getElementById("older-version-list");

const mcServerHost = "ashspiresmpserver.obby.host";
const mcStatusApi = `https://api.mcsrvstat.us/2/${mcServerHost}`;
const serverStatusPill = document.getElementById("server-status-pill");

function compareVersions(a, b) {
    const av = a.replace("version-", "").split(".").map(Number);
    const bv = b.replace("version-", "").split(".").map(Number);

    for (let i = 0; i < Math.max(av.length, bv.length); i++) {
        const x = av[i] || 0;
        const y = bv[i] || 0;
        if (x !== y) {
            return y - x;
        }
    }
    return 0;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderMinecraftStatus(data) {
    if (!serverStatusPill) {
        return;
    }

    if (!data || !data.online) {
        serverStatusPill.textContent = "Offline";
        serverStatusPill.className = "status-pill status-offline";
        return;
    }

    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? 0;

    serverStatusPill.textContent = `Online · ${playersOnline}/${playersMax}`;
    serverStatusPill.className = "status-pill status-online";
}

function loadMinecraftStatus() {
    if (!serverStatusPill) {
        return;
    }

    serverStatusPill.textContent = "Checking server…";
    serverStatusPill.className = "status-pill status-loading";

    fetch(mcStatusApi)
        .then(response => response.json())
        .then(renderMinecraftStatus)
        .catch(() => {
            renderMinecraftStatus(null);
        });
}

function formatChangelog(text) {
    return text
        .trim()
        .split(/\r?\n\r?\n+/)
        .map(block => {
            const trimmed = block.trim();
            if (!trimmed) return "";
            const html = escapeHtml(trimmed)
                .replace(/^[-*]\s+/gm, "• ")
                .replace(/\r?\n/g, "<br>");
            return `<p>${html}</p>`;
        })
        .join("");
}

function extractTitleAndBodyFromChangelog(text) {
    const lines = text.replace(/\r/g, "").split("\n");
    const firstNonEmpty = lines.findIndex(line => line.trim());
    if (firstNonEmpty === -1) {
        return { title: "", body: "" };
    }

    const title = lines[firstNonEmpty].trim();
    const bodyLines = lines.slice(firstNonEmpty + 1);

    while (bodyLines.length && !bodyLines[0].trim()) {
        bodyLines.shift();
    }

    return { title, body: bodyLines.join("\n").trim() };
}

function renderVersionCard(version) {
    const titleText = version.title || `AshSpire ${version.version}`;
    const changelogHtml = version.changelog ? formatChangelog(version.changelog) : "";
    const changelogSection = changelogHtml
        ? `
            <details class="version-changelog">
                <summary>View changelog</summary>
                <div class="changelog-content">
                    ${changelogHtml}
                </div>
            </details>
        `
        : "";

    return `
        <div class="version-card">
            <div class="version-button">
                <span>${escapeHtml(titleText)}</span>
            </div>
            <div class="download-menu">
                ${version.mrpack ? `<a class="download-button" href="${version.mrpack}">Download Modrinth (.mrpack)</a>` : ""}
                ${version.zip ? `<a class="download-button" href="${version.zip}">Download CurseForge (.zip)</a>` : ""}
            </div>
            ${changelogSection}
        </div>
    `;
}

fetch(githubFolder)
    .then(response => response.json())
    .then(folders => {
        const versionFolders = folders.filter(folder => folder.name.startsWith("version-"));

        if (versionFolders.length === 0) {
            latestVersionEl.innerHTML = "<p>No versions found.</p>";
            olderVersionListEl.innerHTML = "";
            return;
        }

        versionFolders.sort((a, b) => compareVersions(a.name, b.name));

        return Promise.all(versionFolders.map(async folder => {
            const filesResponse = await fetch(folder.url);
            const files = await filesResponse.json();

            const jsonFile = files.find(file => file.name === "version.json");
            const changelogFile = files.find(file => /changelog(?:\.md|\.txt)?$/i.test(file.name));
            let versionText = folder.name.replace("version-", "");
            let changelogText = "";

            if (jsonFile) {
                const text = await fetch(jsonFile.download_url).then(res => res.text());
                const trimmed = text.trim();
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed && typeof parsed === "object") {
                        versionText = parsed.version || versionText;
                        if (parsed.changelog) {
                            changelogText = Array.isArray(parsed.changelog)
                                ? parsed.changelog.join("\n\n")
                                : String(parsed.changelog);
                        }
                    } else if (trimmed) {
                        versionText = trimmed;
                    }
                } catch {
                    if (trimmed) {
                        versionText = trimmed;
                    }
                }
            }

            if (changelogFile) {
                const changelogRaw = await fetch(changelogFile.download_url).then(res => res.text());
                if (changelogRaw.trim()) {
                    changelogText = changelogRaw.trim();
                }
            }

            const { title: titleFromChangelog, body: changelogBody } = changelogText
                ? extractTitleAndBodyFromChangelog(changelogText)
                : { title: "", body: "" };
            const mrpack = files.find(file => file.name.endsWith(".mrpack"));
            const zip = files.find(file => file.name.endsWith(".zip"));

            return {
                version: versionText,
                title: titleFromChangelog || `AshSpire ${versionText}`,
                mrpack: mrpack?.download_url || "",
                zip: zip?.download_url || "",
                changelog: changelogBody,
            };
        }));
    })
    .then(versions => {
        if (!versions || !versions.length) {
            latestVersionEl.innerHTML = "<p>No versions found.</p>";
            olderVersionListEl.innerHTML = "";
            return;
        }

        latestVersionEl.innerHTML = renderVersionCard(versions[0]);

        if (versions.length > 1) {
            olderVersionListEl.innerHTML = versions.slice(1).map(renderVersionCard).join("");
        } else {
            olderVersionListEl.innerHTML = "<p>No older versions yet.</p>";
        }
    })
    .catch(error => {
        console.error(error);
        latestVersionEl.innerHTML = "<p>Failed to load latest version.</p>";
        olderVersionListEl.innerHTML = "";
    });

loadMinecraftStatus();
