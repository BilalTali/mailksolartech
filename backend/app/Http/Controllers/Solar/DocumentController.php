<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Document::query();

        if ($user && !$user->isSuperAdmin()) {
            $rootAdminId = $user->getRootAdminId();
            $query->where(function ($q) use ($rootAdminId) {
                if ($rootAdminId) {
                    $q->where('admin_id', $rootAdminId);
                }
                $q->orWhereNull('admin_id'); // Global/Super Admin resources
            });

            // Agents/Enumerators only see published
            if (!$user->isSuperAdmin() && !in_array($user->role, ['admin', 'operator'])) {
                $query->where('is_published', true);
            }
        } elseif (!$user) {
            $query->where('is_published', true);
        }

        $documents = $query->orderBy('sort_order')->orderBy('created_at', 'desc')->get()
            ->map(function (Document $d) {
                return $this->format($d);
            });

        return response()->json(['success' => true, 'data' => $documents]);
    }



    public function store(StoreDocumentRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('documents', 'local');
        }
        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('document_thumbs', 'local');
        }
        unset($data['file'], $data['thumbnail']);

        $data['admin_id'] = $request->user()->id;
        $document = Document::query()->create($data);

        return response()->json(['success' => true, 'data' => $this->format($document)], 201);
    }

    public function update(UpdateDocumentRequest $request, Document $document)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            if ($document->file_path) {
                /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
                $local = Storage::disk('local');
                $local->delete($document->file_path);
                /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
                $public = Storage::disk('public');
                $public->delete($document->file_path);
            }
            $data['file_path'] = $request->file('file')->store('documents', 'local');
        }
        if ($request->hasFile('thumbnail')) {
            if ($document->thumbnail_path) {
                /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
                $local = Storage::disk('local');
                $local->delete($document->thumbnail_path);
                /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
                $public = Storage::disk('public');
                $public->delete($document->thumbnail_path);
            }
            $data['thumbnail_path'] = $request->file('thumbnail')->store('document_thumbs', 'local');
        }
        unset($data['file'], $data['thumbnail']);

        $document->update($data);

        return response()->json(['success' => true, 'data' => $this->format($document)]);
    }

    public function destroy(Document $document)
    {
        if ($document->file_path) {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
            $local = Storage::disk('local');
            $local->delete($document->file_path);
            /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
            $public = Storage::disk('public');
            $public->delete($document->file_path);
        }
        if ($document->thumbnail_path) {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
            $local = Storage::disk('local');
            $local->delete($document->thumbnail_path);
            /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
            $public = Storage::disk('public');
            $public->delete($document->thumbnail_path);
        }
        $document->delete();

        return response()->json(['success' => true]);
    }

    public function getSignedUrl(Request $request, $id, $type = 'file')
    {
        $document = Document::findOrFail($id);
        
        $url = URL::temporarySignedRoute(
            'documents.signed-view',
            now()->addMinutes(120),
            ['id' => $id, 'type' => $type, 'disposition' => $request->query('disposition')]
        );

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['url' => $url]);
        }

        return redirect($url);
    }

    public function viewSigned(Request $request, $id, $type)
    {
        if (!$request->hasValidSignature()) {
            \Illuminate\Support\Facades\Log::warning('Invalid signature for document access', [
                'id' => $id,
                'url' => $request->fullUrl(),
                'ip' => $request->ip()
            ]);
            abort(403, 'Invalid or expired signature.');
        }

        $document = Document::findOrFail($id);
        
        $path = $type === 'thumbnail' ? $document->thumbnail_path : $document->file_path;

        if (!$path) abort(404);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
        $local = Storage::disk('local');
        $isDownload = $request->query('disposition') === 'attachment';

        if ($local->exists($path)) {
            return $isDownload 
                ? $local->download($path, basename($path))
                : $local->response($path);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
        $public = Storage::disk('public');
        if ($public->exists($path)) {
            return $isDownload 
                ? $public->download($path, basename($path))
                : $public->response($path);
        }

        abort(404, 'File not found');
    }

    private function format(Document $d): array
    {
        $file_url = null;
        $download_url = null;
        if ($d->file_path) {
            $file_url = URL::temporarySignedRoute(
                'documents.signed-view',
                now()->addMinutes(120),
                ['id' => $d->id, 'type' => 'file']
            );
            $download_url = URL::temporarySignedRoute(
                'documents.signed-view',
                now()->addMinutes(120),
                ['id' => $d->id, 'type' => 'file', 'disposition' => 'attachment']
            );
        }

        $thumbnail_url = null;
        if ($d->thumbnail_path) {
            $thumbnail_url = URL::temporarySignedRoute(
                'documents.signed-view',
                now()->addMinutes(120),
                ['id' => $d->id, 'type' => 'thumbnail']
            );
        }

        return [
            'id' => $d->id,
            'title' => $d->title,
            'description' => $d->description,
            'category' => $d->category,
            'file_url' => $file_url,
            'download_url' => $download_url,
            'thumbnail_url' => $thumbnail_url,
            'is_published' => $d->is_published,
            'sort_order' => $d->sort_order,
            'created_at' => $d->created_at,
        ];
    }
}
