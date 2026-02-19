const FALLBACK_OWNER = 'linkasu'
const FALLBACK_REPO = 'linka-type-pwa'

function detectRepository() {
  const host = window.location.hostname
  const pathParts = window.location.pathname.split('/').filter(Boolean)

  const ownerFromHost = host.endsWith('github.io') ? host.split('.')[0] : ''
  const repoFromPath = pathParts.length > 0 ? pathParts[0] : ''

  return {
    owner: ownerFromHost || FALLBACK_OWNER,
    repo: repoFromPath || FALLBACK_REPO,
  }
}

function setStatus(message) {
  const status = document.getElementById('status-message')
  status.textContent = message
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'размер неизвестен'
  }

  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function markUnavailable(anchorId, metaId) {
  const anchor = document.getElementById(anchorId)
  const meta = document.getElementById(metaId)
  anchor.removeAttribute('href')
  anchor.setAttribute('aria-disabled', 'true')
  meta.textContent = 'недоступно в последнем релизе'
}

function attachAsset(anchorId, metaId, asset) {
  if (!asset) {
    markUnavailable(anchorId, metaId)
    return
  }

  const anchor = document.getElementById(anchorId)
  const meta = document.getElementById(metaId)
  anchor.href = asset.browser_download_url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.setAttribute('aria-disabled', 'false')
  meta.textContent = `${asset.name} • ${formatSize(asset.size)}`
}

function pickAsset(assets, matcher) {
  return assets.find((asset) => matcher.test(asset.name))
}

function pickMacArmAsset(assets) {
  return pickAsset(assets, /mac-arm64\.dmg$/i) || pickAsset(assets, /mac-universal\.dmg$/i)
}

function pickMacX64Asset(assets) {
  return pickAsset(assets, /mac-x64\.dmg$/i) || pickAsset(assets, /mac-universal\.dmg$/i)
}

function pickWindowsAsset(assets) {
  return pickAsset(assets, /win-(x64|ia32|arm64)\.exe$/i)
}

async function loadLatestRelease() {
  const { owner, repo } = detectRepository()
  const releaseUrl = `https://github.com/${owner}/${repo}/releases`
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`

  const releasesLink = document.getElementById('releases-link')
  releasesLink.href = releaseUrl

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const release = await response.json()
    const assets = Array.isArray(release.assets) ? release.assets : []
    const publishedDate = release.published_at
      ? new Date(release.published_at).toLocaleDateString('ru-RU')
      : 'неизвестно'

    document.getElementById('release-tag').textContent = release.tag_name || 'без тега'
    document.getElementById('release-date').textContent = publishedDate

    attachAsset('download-win', 'meta-win', pickWindowsAsset(assets))
    attachAsset('download-mac-arm64', 'meta-mac-arm64', pickMacArmAsset(assets))
    attachAsset('download-mac-x64', 'meta-mac-x64', pickMacX64Asset(assets))
    attachAsset('download-appimage', 'meta-appimage', pickAsset(assets, /\.AppImage$/i))
    attachAsset('download-deb', 'meta-deb', pickAsset(assets, /\.deb$/i))

    setStatus('Ссылки обновлены из последнего опубликованного релиза.')
  } catch (error) {
    document.getElementById('release-tag').textContent = 'не удалось загрузить'
    document.getElementById('release-date').textContent = 'не удалось загрузить'

    markUnavailable('download-win', 'meta-win')
    markUnavailable('download-mac-arm64', 'meta-mac-arm64')
    markUnavailable('download-mac-x64', 'meta-mac-x64')
    markUnavailable('download-appimage', 'meta-appimage')
    markUnavailable('download-deb', 'meta-deb')

    setStatus('Не удалось получить данные релиза. Используйте ссылку на GitHub Releases ниже.')
    console.error(error)
  }
}

loadLatestRelease()
