import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTE_PATTERN = /^route\.(j|t)sx?$/;
const MIDDLEWARE_PATTERN = /^middleware\.(j|t)sx?$/;
const DTO_PATTERN = /^dto\.(j|t)sx?$/;

export const HTTP_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
];

export const RouteType = {
    DataTransferObject: "dto",
    Middleware: "middleware",
    Route: "route",
}

export class RouteScanner {
    constructor(root) {
        this.root = root;
        this.routes = [];
    }

    async scan() {
        const contents = (await readdir(this.root, {
            recursive: true,
            withFileTypes: true,
        })).filter((c) => c.isFile());
        for (const content of contents) {
            const filePath = content.path;
            const pathnames = this.#omitRoot(filePath.replaceAll("\\", "/"))
                .split("/")
                .map((part) => part.replace(/\[([^\]]+)\]/g, ":$1"))
                .join("/") || "/";
            switch (true) {
                case ROUTE_PATTERN.test(content.name):
                    {
                        const route = await import(pathToFileURL(join(filePath, content.name)).href);
                        this.routes.push({
                            ...route,
                            type: RouteType.Route,
                            metadata: {
                                ...route.metadata,
                            },
                            config: {
                                path: pathnames,
                            },
                        });
                    }
                    break;
                case MIDDLEWARE_PATTERN.test(content.name):
                    {
                        const middleware = await import(pathToFileURL(join(filePath, content.name)).href);
                        if (typeof middleware?.default !== "function") {
                            throw new Error("Middleware must default export a handler function");
                        }
                        this.routes.push({
                            ...middleware,
                            type: RouteType.Middleware,
                            metadata: {
                                ...middleware.metadata,
                            },
                            handler: middleware.default,
                            config: {
                                path: pathnames,
                            },
                        });
                    }
                    break;
                case DTO_PATTERN.test(content.name):
                    {
                        const dto = (await import(pathToFileURL(join(filePath, content.name)).href)).default;
                        if (!dto.validators?.length)
                            throw new Error("Data transfer object must export at least one validator");
                        const handlers = dto.validators.map((validator) => createDTOValidator(validator.schema, validator.triggers ?? []));
                        this.routes.push({
                            ...dto,
                            type: RouteType.DataTransferObject,
                            handler: handlers,
                            metadata: {
                                ...dto.metadata,
                            },
                            config: {
                                path: pathnames,
                            },
                        });
                    }
                    break;
                default:
                    break;
            }
        }
    }

    #omitRoot(path) {
        return path.replace(this.root.replaceAll("\\", "/"), "");
    }

    static isRoute(route) {
        return route.type === RouteType.Route;
    }

    static isMiddlewareOrValidator(route) {
        return (route.type === RouteType.Middleware ||
            route.type === RouteType.DataTransferObject);
    }

    static isMiddleware(route) {
        return route.type === RouteType.Middleware;
    }

    static isValidator(route) {
        return route.type === RouteType.DataTransferObject;
    }
}

function createDTOValidator(schema, triggers) {
    const fn = async (req, _res, next) => {
        const method = req.method.toUpperCase();
        if (triggers.length && !triggers.includes(method))
            return next();
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
    return { triggers: triggers || [], handler: fn };
}