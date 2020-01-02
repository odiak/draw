import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { faHandPointUp, faSlash } from '@fortawesome/free-solid-svg-icons'

export type Tool = 'pen' | 'hand' | 'eraser'

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {
  @Input() title: string = ''
  @Output() titleChange = new EventEmitter<string>()

  @Input() selectedTool: Tool = 'pen'
  @Output() selectedToolChange = new EventEmitter<Tool>()

  @Input() palmRejectionEnabled = false
  @Output() palmRejectionEnabledChange = new EventEmitter<boolean>()

  faHandPointUp = faHandPointUp
  faSlash = faSlash

  constructor() {}

  ngOnInit() {}

  get selectedTool_() {
    return this.selectedTool
  }

  set selectedTool_(tool: Tool) {
    this.selectedToolChange.next(tool)
  }

  togglePalmRejection() {
    this.palmRejectionEnabledChange.next(!this.palmRejectionEnabled)
  }
}
