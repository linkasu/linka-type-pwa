export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface DisplayWorkArea {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  bounds: WindowBounds
  isMaximized: boolean
}

export const MIN_WINDOW_WIDTH = 640
export const MIN_WINDOW_HEIGHT = 480

const DEFAULT_WINDOW_WIDTH = 1366
const DEFAULT_WINDOW_HEIGHT = 900

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isWorkArea = (value: DisplayWorkArea): boolean =>
  value.width > 0 && value.height > 0

export const isWindowState = (value: unknown): value is WindowState => {
  if (!value || typeof value !== 'object') return false

  const state = value as Partial<WindowState>
  const bounds = state.bounds as Partial<WindowBounds> | undefined
  return Boolean(
    bounds
      && isFiniteNumber(bounds.x)
      && isFiniteNumber(bounds.y)
      && isFiniteNumber(bounds.width)
      && isFiniteNumber(bounds.height)
      && bounds.width > 0
      && bounds.height > 0
      && typeof state.isMaximized === 'boolean',
  )
}

const intersectingArea = (bounds: WindowBounds, workArea: DisplayWorkArea): number => {
  const width = Math.max(0, Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x))
  const height = Math.max(0, Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y))
  return width * height
}

const fitToWorkArea = (bounds: WindowBounds, workArea: DisplayWorkArea): WindowBounds => {
  const width = Math.min(bounds.width, workArea.width)
  const height = Math.min(bounds.height, workArea.height)

  return {
    width,
    height,
    x: Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height),
  }
}

export const getInitialWindowBounds = (workArea: DisplayWorkArea): WindowBounds => {
  const width = Math.min(DEFAULT_WINDOW_WIDTH, workArea.width)
  const height = Math.min(DEFAULT_WINDOW_HEIGHT, workArea.height)

  return {
    width,
    height,
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
  }
}

export const resolveWindowState = (
  savedState: unknown,
  workAreas: DisplayWorkArea[],
): WindowState => {
  const availableWorkAreas = workAreas.filter(isWorkArea)
  if (!availableWorkAreas.length) {
    return {
      bounds: { x: 0, y: 0, width: MIN_WINDOW_WIDTH, height: MIN_WINDOW_HEIGHT },
      isMaximized: false,
    }
  }

  const primaryWorkArea = availableWorkAreas[0]
  if (!isWindowState(savedState)) {
    return { bounds: getInitialWindowBounds(primaryWorkArea), isMaximized: false }
  }

  const matchingWorkArea = availableWorkAreas
    .map(workArea => ({ workArea, area: intersectingArea(savedState.bounds, workArea) }))
    .sort((left, right) => right.area - left.area)[0]

  if (matchingWorkArea.area === 0) {
    const width = Math.min(savedState.bounds.width, primaryWorkArea.width)
    const height = Math.min(savedState.bounds.height, primaryWorkArea.height)
    return {
      bounds: {
        width,
        height,
        x: primaryWorkArea.x + Math.round((primaryWorkArea.width - width) / 2),
        y: primaryWorkArea.y + Math.round((primaryWorkArea.height - height) / 2),
      },
      isMaximized: savedState.isMaximized,
    }
  }

  return {
    bounds: fitToWorkArea(savedState.bounds, matchingWorkArea.workArea),
    isMaximized: savedState.isMaximized,
  }
}
