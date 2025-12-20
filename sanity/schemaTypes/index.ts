// sanity/schemaTypes/index.ts
import blockContent from './blockContentType'
import tag from './tagType'
import review from './reviewType'
import article from './articleType'
import news from './newsType'
import game from './gameType'
import gameRelease from './gameReleaseType'
import developer from './developerType' 
import publisher from './publisherType' 
import imageCompare from './imageCompareType'
import twoImageGrid from './twoImageGridType'
import fourImageGrid from './fourImageGridType'
import gameDetails from './gameDetailsType'
import table from './tableType'
import author from './creators/authorType'
import designer from './creators/designerType'
import reporter from './creators/reporterType'
import reviewer from './creators/reviewerType'
import colorDictionary from './custom_inputs/colorDictionaryType'
import youtube from './custom_objects/youtubeType'
import homepageSettings from './homepageSettingsType'

export const schemaTypes = [
  // Documents
  review,
  article,
  news,
  game,
  gameRelease,
  tag,
  developer, 
  publisher, 
  // Creators
  author,
  designer,
  reporter,
  reviewer,
  // Singleton Documents
  colorDictionary,
  homepageSettings,
  // Objects & Custom Inputs
  blockContent,
  imageCompare,
  twoImageGrid,
  fourImageGrid,
  gameDetails,
  table,
  youtube,
]


