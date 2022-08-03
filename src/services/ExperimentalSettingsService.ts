import { memo } from '../utils/memo'
import { Variable } from '../utils/Variable'
import { localStorage } from '../utils/localStorage'

const drawingSettingsKey = 'KAKERU_EXPERIMENTAL_SETTINGS'

type ExperimentalSettings = {
  hackForSamsungGalaxyNote: boolean
  disableSmoothingPaths: boolean
  disableScaleLimit: boolean
}

export class ExperimentalSettingsService {
  static readonly instantiate = memo(() => new ExperimentalSettingsService())

  experimentalSettings: Variable<Partial<ExperimentalSettings>>

  constructor() {
    this.experimentalSettings = new Variable(this.deserializeExperimentalSettings())

    window.addEventListener('storage', (event) => {
      if (event.key === drawingSettingsKey && event.storageArea === localStorage) {
        this.experimentalSettings.next(this.deserializeExperimentalSettings())
      }
    })
  }

  private deserializeExperimentalSettings(): Partial<ExperimentalSettings> {
    const s: Partial<ExperimentalSettings> = {}

    const jsonStr = localStorage.getItem(drawingSettingsKey)
    if (jsonStr == null) return s
    const obj: { [key: string]: unknown } = JSON.parse(jsonStr)

    const { hackForSamsungGalaxyNote, disableSmoothingPaths, disableScaleLimit } = obj

    if (typeof hackForSamsungGalaxyNote === 'boolean') {
      s.hackForSamsungGalaxyNote = hackForSamsungGalaxyNote
    }

    if (typeof disableSmoothingPaths === 'boolean') {
      s.disableSmoothingPaths = disableSmoothingPaths
    }

    if (typeof disableScaleLimit === 'boolean') {
      s.disableScaleLimit = disableScaleLimit
    }

    return s
  }

  setExperimentalSettings(settings: Partial<ExperimentalSettings>) {
    try {
      localStorage.setItem(drawingSettingsKey, JSON.stringify(settings))
    } finally {
      // nothing
    }
    this.experimentalSettings.next(settings)
  }
}
