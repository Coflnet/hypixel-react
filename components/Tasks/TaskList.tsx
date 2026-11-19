'use client'

import { useMemo, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import type { PublicTask } from '../../api/publicTaskApi'
import { TaskCategoryNav } from './TaskCategoryNav'
import { TaskCategorySection } from './TaskCategorySection'
import { groupTasksByCategory, type TaskCategoryGroup } from './taskUtils'

const ALL_CATEGORIES = ''

function matchesSearch(task: PublicTask, search: string): boolean {
    if (!search) {
        return true
    }
    const haystack = [task.name, task.category, task.island, task.where].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search)
}

function filterGroups(groups: TaskCategoryGroup[], category: string, search: string): TaskCategoryGroup[] {
    const normalizedSearch = search.trim().toLowerCase()
    return groups
        .filter(group => category === ALL_CATEGORIES || group.category === category)
        .map(group => ({ ...group, tasks: group.tasks.filter(task => matchesSearch(task, normalizedSearch)) }))
        .filter(group => group.tasks.length > 0)
}

/**
 * Grouped task list with search, category filter and an anchor nav of the visible categories.
 * The initial (server) render has no filter applied, so the full list is in the HTML.
 */
export function TaskList({ tasks }: { tasks: PublicTask[] }) {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState(ALL_CATEGORIES)
    const groups = useMemo(() => groupTasksByCategory(tasks), [tasks])
    const visibleGroups = useMemo(() => filterGroups(groups, category, search), [groups, category, search])

    return (
        <>
            <TaskCategoryNav groups={visibleGroups} />
            <Row className="g-2 mb-2">
                <Col md={8}>
                    <Form.Control
                        type="search"
                        placeholder="Search tasks, islands or locations"
                        aria-label="Search tasks"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value={ALL_CATEGORIES}>All categories</option>
                        {groups.map(group => (
                            <option key={group.anchor} value={group.category}>
                                {group.category}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
            </Row>
            {visibleGroups.length === 0 ? <p className="text-muted mt-3">No tasks match your filter.</p> : null}
            {visibleGroups.map(group => (
                <TaskCategorySection key={group.anchor} group={group} />
            ))}
        </>
    )
}
