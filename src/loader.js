import { Router } from "express";
import { HTTP_METHODS, RouteScanner } from "./scanner.js";

export async function setup(app, dir) {
    const routeScanner = new RouteScanner(dir);
    await routeScanner.scan();

    const routes = Object.groupBy(routeScanner.routes, (route) => {
        return resolvePath(route.config.path).entry;
    });

    for (const path in routes) {
        const routesGroup = routes[path].sort((a, b) => {
            if (RouteScanner.isMiddlewareOrValidator(a) &&
                !RouteScanner.isMiddlewareOrValidator(b)) {
                return -1;
            }
            if (!RouteScanner.isMiddlewareOrValidator(a) &&
                RouteScanner.isMiddlewareOrValidator(b)) {
                return 1;
            }
            return 0;
        });

        const router = Router();

        for (const route of routesGroup) {
            const { path } = resolvePath(route.config.path);
            if (RouteScanner.isMiddlewareOrValidator(route)) {
                let handlers = route.handler || [];
                if (!Array.isArray(handlers)) {
                    handlers = [handlers];
                }
                for (const _handler of handlers) {
                    if (typeof _handler === "function") {
                        router.use(path, _handler);
                        continue;
                    }
                    _handler.triggers.forEach((trigger) => {
                        router[trigger.toLowerCase()](path, _handler.handler);
                    });
                }
                continue;
            }

            HTTP_METHODS.forEach((method) => {
                if (method in route) {
                    const type = method.toLowerCase();
                    router[type](path, route[method]);
                }
            });
        }

        app.use(path, router);
    }
}

function resolvePath(_path) {
    const path = _path.split("/");
    const entry = path[1] ? `/${path[1]}` : "/";
    const newPath = path.slice(2).join("/");

    return { entry, path: newPath ? `/${newPath}` : "/" };
}