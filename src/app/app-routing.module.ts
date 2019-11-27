import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { DrawingScreenComponent } from './drawing-screen/drawing-screen.component'

const routes: Routes = [
  { path: '', pathMatch: 'full', component: DrawingScreenComponent },
  { path: 'p/:pictureId', component: DrawingScreenComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
