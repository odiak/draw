# Kakeru API Spec (beta)

## Basics

```
Host: https://i.kakeru.app
Authorization: Bearer $token
```

You can get $token on [account settings](https://kakeru.app/settings).

This document uses JSON with comments.

## GET /api/boards

List boards, sorted by `createdAt` in descending order.

**Currently, it just return first 30 boards.**

### Response

```
{
  "boards": [
    {
      "id": "1fa2329bc80eb299bc",
      "title": "Test board",
      // public, protected, or private
      "accessibilityLevel": "public",
      "createdAt": "2024-10-02T00:00:00Z",
      "updatedAt": "2024-10-02T00:00:00Z"
    },
    {
      "id": "2fa2329bc80eb299bc",
      "title": "Test board 2",
      "accessibilityLevel": "private",
      "createdAt": "2024-10-01T00:00:00Z",
      "updatedAt": "2024-10-01T00:00:00Z"
    },
  ]
}
```

## GET /api/boards/{boardId}

Get board with given ID.

**Not implemented yet.**

### Response

```
{
  "id": "1fa2329bc80eb299bc",
  "title": "Test board",
  "accessibilityLevel": "public",
  "createdAt": "2024-10-02T00:00:00Z",
  "updatedAt": "2024-10-02T00:00:00Z"
}
```

## POST /api/boards

Create a new board.

**Not implemented yet.**

### Request

```
{
  "title": "Test board",
  "accessibilityLevel": "public"
}
```

### Response

```
{
  "id": "1fa2329bc80eb299bc",
  "title": "Test board",
  "accessibilityLevel": "public",
  "createdAt": "2024-10-02T00:00:00Z",
  "updatedAt": "2024-10-02T00:00:00Z"
}
```

## PATCH /api/boards/{boardId}

Update board with given ID.

**Not implemented yet.**

### Request

```
{
  "title": "Test board 2",
  "accessibilityLevel": "private"
}
```

### Response

```
{
  "id": "1fa2329bc80eb299bc",
  "title": "Test board 2",
  "accessibilityLevel": "private",
  "createdAt": "2024-10-02T00:00:00Z",
  "updatedAt": "2024-10-02T00:00:00Z"
}
```
