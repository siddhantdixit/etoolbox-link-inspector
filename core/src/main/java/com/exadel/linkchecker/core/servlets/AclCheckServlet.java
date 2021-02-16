package com.exadel.linkchecker.core.servlets;

import com.exadel.linkchecker.core.services.helpers.RepositoryHelper;
import com.exadel.linkchecker.core.services.util.ServletUtil;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Session;
import javax.json.Json;
import javax.servlet.Servlet;
import java.util.Optional;

@Component(service = {Servlet.class})
@SlingServletResourceTypes(
        resourceTypes = "/bin/aembox/acl-check",
        methods = HttpConstants.METHOD_POST
)
@ServiceDescription("The servlet for checking ACLs")
public class AclCheckServlet extends SlingAllMethodsServlet {
    private static final Logger LOG = LoggerFactory.getLogger(AclCheckServlet.class);

    private static final String PATH_PARAM = "path";
    private static final String PERMISSIONS_PARAM = "permissions";
    private static final String HAS_PERMISSIONS_RESPONSE_PARAM = "hasPermissions";

    @Reference
    private RepositoryHelper repositoryHelper;

    @Override
    protected void doPost(final SlingHttpServletRequest request, final SlingHttpServletResponse response) {
        String path = ServletUtil.getRequestParamString(request, PATH_PARAM);
        String permissions = ServletUtil.getRequestParamString(request, PERMISSIONS_PARAM);
        if (StringUtils.isAnyBlank(path, permissions)) {
            response.setStatus(HttpStatus.SC_BAD_REQUEST);
            LOG.warn("Path is blank, ACL check failed");
            return;
        }
        Optional<Session> session = Optional.ofNullable(request.getResourceResolver().adaptTo(Session.class));
        if (!session.isPresent()) {
            response.setStatus(HttpStatus.SC_BAD_REQUEST);
            LOG.warn("ACL check failed, session is null. Path: {}", path);
            return;
        }

        boolean hasPermissions = repositoryHelper.hasPermissions(session.get(), path, permissions);
        String jsonResponse = Json.createObjectBuilder()
                .add(HAS_PERMISSIONS_RESPONSE_PARAM, hasPermissions)
                .build()
                .toString();
        ServletUtil.writeJsonResponse(response, jsonResponse);
    }
}