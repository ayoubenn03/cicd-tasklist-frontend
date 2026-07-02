import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask, getTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('getTask returns a single task', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockTask) }));

	const task = await getTask(1);
	expect(task).toEqual(mockTask);
	expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
});

it('createTask sends a POST request with the payload', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockTask) }));

	const task = await createTask({ title: 'Test' });

	expect(task).toEqual(mockTask);
	expect(fetch).toHaveBeenCalledWith('/api/tasks', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title: 'Test' }),
	});
});

it('updateTask sends a PUT request with the payload', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ...mockTask, completed: true }) }));

	const task = await updateTask(1, { completed: true });

	expect(task.completed).toBe(true);
	expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ completed: true }),
	});
});

it('deleteTask resolves when the response is ok', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

	await expect(deleteTask(1)).resolves.toBeUndefined();
	expect(fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
});

it('throws an error when the response is not ok', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Internal Server Error') }));

	await expect(getTasks()).rejects.toThrow('HTTP 500');
});
});
