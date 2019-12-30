import { NgModule } from '@angular/core'
import { Routes, RouterModule, UrlMatchResult, UrlSegment } from '@angular/router'
import { DrawingScreenComponent } from './drawing-screen/drawing-screen.component'

export function pictureIdMatcher(segments: UrlSegment[]): UrlMatchResult {
  if (segments.length === 1 && segments[0].path.match(/^[0-9a-f]{32}$/)) {
    return { consumed: segments, posParams: { pictureId: segments[0] } }
  }
  return (null as unknown) as UrlMatchResult
}

const routes: Routes = [
  { path: '', pathMatch: 'full', component: DrawingScreenComponent },
  { path: 'p/:pictureId', redirectTo: ':pictureId' },
  {
    matcher: pictureIdMatcher,
    component: DrawingScreenComponent
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
