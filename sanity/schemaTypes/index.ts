import blockContent from './blockContentType'
import tag from './tagType'
import review from './reviewType'
import article from './articleType'
import news from './newsType'
import game from './gameType'
import gameRelease from './gameReleaseType'
import imageCompare from './imageCompareType'
import twoImageGrid from './twoImageGridType'
import fourImageGrid from './fourImageGridType'
// NEW IMPORTS
import author from './creators/authorType'
import designer from './creators/designerType'
import reporter from './creators/reporterType'
import reviewer from './creators/reviewerType'

export const schemaTypes = [review, article, news, author, designer, reporter, reviewer, game, tag, gameRelease, blockContent, imageCompare, twoImageGrid, fourImageGrid]