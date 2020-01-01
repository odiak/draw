import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class TitleAdapterService {
  readonly title = new Subject<string>()
}
