"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Task extends base_1.DataModel {
    constructor(data) {
        super('task', 'task');
        this.props = {};
        this.schema = [
            'id',
            'isCompleted',
            'title',
            'content',
            'deadline',
        ];
        if (data) {
            if (data.id)
                this.props.id = data.id;
            if (data.isCompleted)
                this.props.isCompleted = data.isCompleted;
            if (data.title)
                this.props.title = data.title;
            if (data.content)
                this.props.content = data.content;
            if (data.deadline)
                this.props.deadline = data.deadline;
        }
    }
    getShema() {
        return this.schema;
    }
}
exports.Task = Task;
